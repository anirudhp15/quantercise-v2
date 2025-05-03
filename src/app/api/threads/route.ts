import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser, getAuth } from "@clerk/nextjs/server";
import { Database } from "@/../types/supabase";
import { z } from "zod";

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Add Edge-compatible options with retry mechanism
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    // Add retry handling for fetch calls
    fetch: async (url, options = {}) => {
      const MAX_RETRIES = 3;
      let retryCount = 0;

      while (retryCount < MAX_RETRIES) {
        try {
          const response = await fetch(url, options);
          return response;
        } catch (error) {
          retryCount += 1;

          // Only retry on network/fetch failures
          if (
            error instanceof Error &&
            error.message.includes("fetch failed") &&
            retryCount < MAX_RETRIES
          ) {
            console.warn(
              `Supabase fetch attempt ${retryCount} failed, retrying...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * retryCount)
            ); // Exponential backoff
          } else {
            // Re-throw the error after all retries failed
            throw error;
          }
        }
      }

      // This should never be reached due to the throw in the catch block,
      // but TypeScript needs a return value
      return null as any;
    },
  },
});

// Helper to check if an error is related to connectivity issues
function isConnectionError(error: any): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("fetch failed") ||
      error.message.includes("network") ||
      error.message.includes("timeout"))
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode") || "summary";

  // Track database connection status
  let databaseStatus = "ok";

  try {
    // Get the auth information but don't fail if not authenticated
    let clerkId = "";

    try {
      // Try getAuth first (more reliable in Edge runtime)
      const auth = getAuth(req);
      clerkId = auth.userId || "";

      // If not available, fall back to currentUser
      if (!clerkId) {
        const user = await currentUser();
        clerkId = user?.id || "";
      }

      console.log("GET Clerk ID:", clerkId);
    } catch (authError) {
      console.warn("Error getting authenticated user:", authError);
      // Continue without authentication in development mode
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Authentication error", threads: [] },
          { status: 401 }
        );
      }
    }

    // IMPORTANT: When in production, never generate random IDs for unauthenticated users
    // This is just for development mode
    let effectiveClerkId = clerkId;
    if (!effectiveClerkId) {
      if (process.env.NODE_ENV === "development") {
        // Use a fixed anonymous ID for development to make testing easier
        effectiveClerkId = `anon-development-user`;
      } else {
        // In production, we should only return authenticated users' threads
        return NextResponse.json({ threads: [] });
      }
    }

    console.log("Using effective clerk ID:", effectiveClerkId);

    if (id) {
      // Get a specific thread
      let thread = null;
      let threadError = null;

      try {
        const response = await supabase
          .from("threads")
          .select("*")
          .eq("id", id)
          .eq("clerk_id", effectiveClerkId)
          .single();

        thread = response.data;
        threadError = response.error;

        if (threadError && threadError.code !== "PGRST116") {
          console.error("Error fetching thread:", threadError);

          if (isConnectionError(threadError)) {
            console.log(
              "Connection error detected when fetching thread, continuing with fallback"
            );
            databaseStatus = "degraded";
          } else if (process.env.NODE_ENV !== "development") {
            return NextResponse.json(
              { error: threadError.message },
              { status: 500 }
            );
          }
        }
      } catch (error) {
        console.error("Exception fetching thread:", error);
        if (isConnectionError(error)) {
          databaseStatus = "degraded";
        } else if (process.env.NODE_ENV !== "development") {
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
          );
        }
      }

      // If not in fallback mode and thread not found, return 404
      if (!thread && databaseStatus === "ok") {
        return NextResponse.json(
          { error: "Thread not found" },
          { status: 404 }
        );
      }

      // Get messages for the thread
      let messages: any[] = [];

      try {
        const response = await supabase
          .from("messages")
          .select("*")
          .eq("thread_id", id)
          .order("created_at", { ascending: true });

        messages = response.data || [];
        const messagesError = response.error;

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);

          if (isConnectionError(messagesError)) {
            console.log(
              "Connection error detected when fetching messages, continuing with fallback"
            );
            databaseStatus = "degraded";
          } else if (process.env.NODE_ENV !== "development") {
            return NextResponse.json(
              { error: messagesError.message },
              { status: 500 }
            );
          }
        }
      } catch (error) {
        console.error("Exception fetching messages:", error);
        if (isConnectionError(error)) {
          databaseStatus = "degraded";
        } else if (process.env.NODE_ENV !== "development") {
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        thread: thread || { id, temporary: true },
        messages,
        databaseStatus,
        ...(databaseStatus === "degraded"
          ? { msg: "Some database operations failed" }
          : {}),
      });
    } else {
      console.log(`Fetching all threads for clerk_id: ${effectiveClerkId}`);

      // DEVELOPMENT MODE: If we're in development and not authenticated,
      // return all threads for testing purposes
      if (process.env.NODE_ENV === "development" && !clerkId) {
        console.log("Development mode: returning all threads");

        let allThreads: any[] = [];

        try {
          const response = await supabase
            .from("threads")
            .select("*")
            .order("updated_at", { ascending: false });

          allThreads = response.data || [];
          const error = response.error;

          if (error) {
            console.error("Error fetching all threads:", error);

            if (isConnectionError(error)) {
              console.log(
                "Connection error detected, continuing with empty threads array"
              );
              databaseStatus = "degraded";
            }
          }
        } catch (error) {
          console.error("Exception fetching all threads:", error);
          if (isConnectionError(error)) {
            databaseStatus = "degraded";
          }
        }

        console.log(`Found ${allThreads?.length || 0} total threads`);
        return NextResponse.json({
          threads: allThreads,
          databaseStatus,
          ...(databaseStatus === "degraded"
            ? { msg: "Database connection failed, showing limited data" }
            : {}),
        });
      }

      // Get all threads for the user
      let threads: any[] = [];

      try {
        const response = await supabase
          .from("threads")
          .select("*")
          .eq("clerk_id", effectiveClerkId)
          .order("updated_at", { ascending: false });

        threads = response.data || [];
        const error = response.error;

        if (error) {
          console.error("Error fetching threads:", error);

          if (isConnectionError(error)) {
            console.log(
              "Connection error detected, continuing with empty threads array"
            );
            databaseStatus = "degraded";
          } else if (process.env.NODE_ENV !== "development") {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
      } catch (error) {
        console.error("Exception fetching threads:", error);
        if (isConnectionError(error)) {
          databaseStatus = "degraded";
        } else if (process.env.NODE_ENV !== "development") {
          return NextResponse.json(
            { error: "Database error" },
            { status: 500 }
          );
        }
      }

      console.log(`Found ${threads?.length || 0} threads`);
      return NextResponse.json({
        threads,
        databaseStatus,
        ...(databaseStatus === "degraded"
          ? { msg: "Database connection failed, showing limited data" }
          : {}),
      });
    }
  } catch (error) {
    console.error("Error in GET /api/threads:", error);
    return NextResponse.json(
      { error: "Internal server error", threads: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, mode, initialMessage } = await req.json();

    if (!mode) {
      return NextResponse.json(
        { error: "Invalid mode. Mode is required." },
        { status: 400 }
      );
    }

    if (mode !== "student" && mode !== "teacher") {
      return NextResponse.json(
        {
          error: "Invalid mode. Mode must be one of: student, teacher",
        },
        { status: 400 }
      );
    }

    // Get auth information using the consistent approach
    let clerkId = "";
    try {
      // Try getAuth first (more reliable in Edge runtime)
      const auth = getAuth(req);
      clerkId = auth.userId || "";

      // If not available, fall back to currentUser
      if (!clerkId) {
        const user = await currentUser();
        clerkId = user?.id || "";
      }

      console.log("POST Clerk ID:", clerkId);
    } catch (authError) {
      console.warn("Error getting authenticated user for POST:", authError);
      // In development mode, continue without auth
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Authentication error" },
          { status: 401 }
        );
      }
    }

    // In development mode, use a fixed anonymous ID for testing
    let effectiveClerkId = clerkId;
    if (!effectiveClerkId && process.env.NODE_ENV === "development") {
      effectiveClerkId = "anon-development-user";
      console.log("Using development anonymous ID");
    } else if (!effectiveClerkId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Using effective clerk ID:", effectiveClerkId);

    // First try to alter the table if needed (only in development)
    if (process.env.NODE_ENV === "development") {
      try {
        // Check if clerk_id column exists
        await supabase.from("threads").select("clerk_id").limit(1);
      } catch (e) {
        console.log("clerk_id column might not exist, continue anyway");
      }
    }

    // Create a new thread with explicit clerk_id
    const { data: thread, error } = await supabase
      .from("threads")
      .insert({
        user_id: crypto.randomUUID(),
        clerk_id: effectiveClerkId,
        title: title || `New ${mode} thread`,
        mode,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);

      // If there's a specific error about the clerk_id column not existing
      if (error.message?.includes('column "clerk_id" does not exist')) {
        return NextResponse.json(
          {
            error:
              "Database schema issue: clerk_id column doesn't exist. Please run the migration script.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Created thread:", thread);
    return NextResponse.json({ thread });
  } catch (error) {
    console.error("Error in POST /api/threads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (!id) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    // Get auth information using the consistent approach
    let clerkId = "";
    try {
      // Try getAuth first (more reliable in Edge runtime)
      const auth = getAuth(req);
      clerkId = auth.userId || "";

      // If not available, fall back to currentUser
      if (!clerkId) {
        const user = await currentUser();
        clerkId = user?.id || "";
      }

      console.log("DELETE Clerk ID:", clerkId);
    } catch (authError) {
      console.warn("Error getting authenticated user for DELETE:", authError);
      // In development mode, continue without auth
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Authentication error" },
          { status: 401 }
        );
      }
    }

    // In development mode, allow deleting any thread if no clerk ID
    if (process.env.NODE_ENV === "development" && !clerkId) {
      const { error } = await supabase.from("threads").delete().eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // In production, require authentication
    if (!clerkId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if the thread belongs to the user
    const { data: thread, error: checkError } = await supabase
      .from("threads")
      .select("*")
      .eq("id", id)
      .eq("clerk_id", clerkId)
      .single();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found or not owned by you" },
        { status: 404 }
      );
    }

    // Delete the thread
    const { error: deleteError } = await supabase
      .from("threads")
      .delete()
      .eq("id", id)
      .eq("clerk_id", clerkId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Also delete all associated messages
    const { error: deleteMessagesError } = await supabase
      .from("messages")
      .delete()
      .eq("thread_id", id);

    if (deleteMessagesError) {
      console.error("Error deleting messages:", deleteMessagesError);
      // We don't return an error here since we already deleted the thread
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/threads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
