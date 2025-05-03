import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";
import { Database } from "@/../types/supabase";
import { z } from "zod";

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function GET(
  req: Request,
  { params }: { params: Record<string, string> }
) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode") || "summary";

  try {
    // Get the auth information but don't fail if not authenticated
    const user = await currentUser();
    // console.log("GET Auth object:", JSON.stringify(user, null, 2));

    const clerkId = user?.id || "";
    console.log("GET Clerk ID:", clerkId);

    // Allow anonymous access with a generated ID if not authenticated
    // This is just for development purposes - in production you'd handle auth differently
    const effectiveClerkId = clerkId || `anon-${crypto.randomUUID()}`;
    console.log("Using effective clerk ID:", effectiveClerkId);

    if (id) {
      // Get a specific conversation
      const { data: conversation, error: conversationError } = await supabase
        .from("threads")
        .select("*")
        .eq("id", id)
        .eq("clerk_id", effectiveClerkId)
        .single();

      if (conversationError) {
        return NextResponse.json(
          { error: conversationError.message },
          { status: 500 }
        );
      }

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      // Get messages for the conversation
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        return NextResponse.json(
          { error: messagesError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        conversation,
        messages,
      });
    } else {
      console.log(
        `Fetching all conversations for clerk_id: ${effectiveClerkId}`
      );

      // DEVELOPMENT MODE: If we're in development and not authenticated,
      // return all conversations for testing purposes
      if (process.env.NODE_ENV === "development" && !clerkId) {
        console.log("Development mode: returning all conversations");
        const { data: allConversations, error } = await supabase
          .from("threads")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching all conversations:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(
          `Found ${allConversations?.length || 0} total conversations`
        );
        return NextResponse.json({ conversations: allConversations || [] });
      }

      // Get all conversations for the user
      const { data: conversations, error } = await supabase
        .from("threads")
        .select("*")
        .eq("clerk_id", effectiveClerkId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`Found ${conversations?.length || 0} conversations`);
      return NextResponse.json({ conversations: conversations || [] });
    }
  } catch (error) {
    console.error("Error in GET /api/conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    // Get auth information
    const user = await currentUser();
    console.log("Auth object:", JSON.stringify(user, null, 2));

    // The userId comes from Clerk
    const clerkId = user?.id || "";
    console.log("Clerk ID from auth:", clerkId);

    // If no Clerk ID is available, use an anonymous ID
    const effectiveClerkId = clerkId || `anon-${crypto.randomUUID()}`;
    console.log("Using effective clerk ID:", effectiveClerkId);

    if (!effectiveClerkId) {
      return NextResponse.json(
        { error: "Failed to identify user" },
        { status: 401 }
      );
    }

    // First try to alter the table if needed (only in development)
    if (process.env.NODE_ENV === "development") {
      try {
        // Check if clerk_id column exists
        await supabase.from("threads").select("clerk_id").limit(1);
      } catch (e) {
        console.log("clerk_id column might not exist, continue anyway");
      }
    }

    // Create a new conversation with explicit clerk_id
    const { data: conversation, error } = await supabase
      .from("threads")
      .insert({
        user_id: `anonymous-${crypto.randomUUID()}`,
        clerk_id: effectiveClerkId,
        title: title || `New ${mode} conversation`,
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

    console.log("Created conversation:", conversation);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error in POST /api/conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Record<string, string> }
) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    const user = await currentUser();
    console.log("DELETE Auth object:", JSON.stringify(user, null, 2));

    const clerkId = user?.id || "";
    console.log("DELETE Clerk ID:", clerkId);

    // Use an anonymous ID if no Clerk ID is available
    const effectiveClerkId = clerkId || "";

    if (!effectiveClerkId) {
      return NextResponse.json(
        { error: "Failed to identify user" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Check if the conversation belongs to the user
    const { data: conversation, error: checkError } = await supabase
      .from("threads")
      .select("*")
      .eq("id", id)
      .eq("clerk_id", effectiveClerkId)
      .single();

    if (checkError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete related messages first
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("thread_id", id);

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    // Delete the conversation
    const { error: conversationError } = await supabase
      .from("threads")
      .delete()
      .eq("id", id);

    if (conversationError) {
      return NextResponse.json(
        { error: conversationError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
