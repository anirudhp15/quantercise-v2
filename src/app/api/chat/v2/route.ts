import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js"; // Import Supabase client
import { Database } from "@/../types/supabase"; // Import Supabase types if you have them
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk's getAuth

export const runtime = "edge"; // Use edge runtime for streaming

// IMPORTANT: Generate a random UUID for anonymous users rather than using a hardcoded one
function getAnonProfileId() {
  return `anon-${uuidv4()}`;
}

// Initialize Supabase client with Edge compatibility options
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Key for server-side
  {
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
  }
);

// Helper to check if an error is related to connectivity issues
function isConnectionError(error: any): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("fetch failed") ||
      error.message.includes("network") ||
      error.message.includes("timeout"))
  );
}

// Define the URL of your Python LangServe server
const LANGSERVE_URL =
  process.env.LANGSERVE_URL || "http://localhost:8000/quantercise/stream"; // Added Langserve URL

// Helper function to ensure a user has a profile
async function ensureUserProfile(clerkId: string | null): Promise<string> {
  // If no clerk ID, create a temporary profile
  if (!clerkId) {
    return await createTemporaryProfile();
  }

  // Try to find existing profile
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();

    if (profile) {
      console.log("Found existing profile:", profile.id);
      return profile.id;
    }

    // Profile not found, create new one
    console.log("Creating new profile for clerk_id:", clerkId);
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        clerk_id: clerkId,
        full_name: `User ${clerkId.substring(0, 8)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create profile:", createError);
      return await createTemporaryProfile();
    }

    return newProfile.id;
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return await createTemporaryProfile();
  }
}

// Helper to create a temporary profile when needed
async function createTemporaryProfile(): Promise<string> {
  const tempId = uuidv4();
  try {
    console.log("Creating temporary profile");
    const tempClerkId = `temp-${uuidv4()}`;
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: tempId,
        clerk_id: tempClerkId,
        full_name: `Temporary User`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create temporary profile:", error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error("Error creating temporary profile:", error);
    throw new Error("Could not create profile");
  }
}

export async function POST(req: NextRequest) {
  try {
    // --- Get Authenticated User ---
    const { userId: clerkId } = getAuth(req); // Use getAuth for edge routes
    console.log("Retrieved Clerk ID:", clerkId);

    // --- Parse Request Body ---
    const body = await req.json();
    const {
      message,
      threadId: existingThreadId,
      settings = {}, // Grade level, tone, etc.
      imageData, // Optional image data { base64, contentType, filename, size }
      mode = "student", // Add mode extraction or default
    } = body;

    if (!message && !imageData) {
      return new Response(
        JSON.stringify({ error: "Message or image is required" }),
        {
          status: 400,
        }
      );
    }

    // --- Determine Thread ID ---
    const threadId = existingThreadId || uuidv4();
    const isNewThread = !existingThreadId;

    // --- Track database connection status ---
    let skipDatabaseOperations = false;
    let databaseStatus = "ok";

    // --- Handle profile and thread creation with better error handling ---
    try {
      if (isNewThread) {
        // First, handle clerkId situation
        let clerkIdToUse = clerkId || null; // Use null if no clerk ID
        console.log(
          `Creating new thread for clerk_id: ${clerkIdToUse || "anonymous"}`
        );

        // Get or create a profile ID - this is required by the threads table
        let profileId: string = ""; // Initialize the variable
        try {
          profileId = await ensureUserProfile(clerkIdToUse);
          console.log(`Using profile ID for thread: ${profileId}`);
        } catch (profileError) {
          console.error("Failed to get/create profile:", profileError);
          skipDatabaseOperations = true;
          databaseStatus = "degraded";
          // Continue with rest of function since we'll use temporary thread
        }

        if (!skipDatabaseOperations && profileId) {
          // Check that we have a profile ID
          try {
            console.log(
              `Creating new thread record (ID: ${threadId}) with profile_id: ${profileId}`
            );
            const { error: insertError } = await supabase
              .from("threads")
              .insert({
                id: threadId,
                clerk_id: clerkIdToUse,
                profile_id: profileId,
                user_id: uuidv4(), // Generate a user ID if needed by schema
                mode: mode,
                title: `New ${mode} chat`, // Default title
                updated_at: new Date().toISOString(),
              } as any);

            if (insertError) {
              console.error("Failed to create thread record:", insertError);
              skipDatabaseOperations = true;
              databaseStatus = "degraded";
            } else {
              console.log("Successfully created thread record");
            }
          } catch (dbError) {
            console.error("Exception during thread creation:", dbError);
            skipDatabaseOperations = true;
            databaseStatus = "degraded";
          }
        }
      }
    } catch (error) {
      console.error("Outer exception handling profiles/threads:", error);
      skipDatabaseOperations = true;
      databaseStatus = "degraded";
    }

    console.log(`--- API Request ---`);
    console.log(`Thread ID: ${threadId} (${isNewThread ? "New" : "Existing"})`);
    console.log(`Message: ${message?.substring(0, 100)}...`);
    console.log(`Settings: ${JSON.stringify(settings)}`);
    console.log(`Image Provided: ${!!imageData}`);
    console.log(`Database Status: ${databaseStatus}`);
    console.log(`-------------------`);

    // --- Call the Python LangServe stream endpoint ---
    console.log(`Calling LangServe (${LANGSERVE_URL}) for thread ${threadId}`);

    try {
      const pythonResponse = await fetch(LANGSERVE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          input: {
            userInput: message || "",
            sessionId: threadId,
            settings: settings,
          },
          config: {},
          kwargs: {},
        }),
        // @ts-ignore // Needed for duplex in some edge runtimes
        duplex: "half",
      });

      if (!pythonResponse.ok) {
        const errorBody = await pythonResponse.text();
        console.error(
          `LangServe request failed (${pythonResponse.status}):`,
          errorBody
        );
        return NextResponse.json(
          {
            error: `LangServe error: ${pythonResponse.statusText}`,
            details: errorBody,
          },
          { status: pythonResponse.status }
        );
      }

      if (!pythonResponse.body) {
        console.error("No response body received from LangServe stream.");
        return NextResponse.json(
          { error: "No response body from LangServe" },
          { status: 500 }
        );
      }

      // Create the pass-through stream
      const stream = new ReadableStream({
        async start(controller) {
          console.log(`Starting to stream response for thread ${threadId}`);
          const encoder = new TextEncoder();

          // Send initial threadId if it's a new thread
          if (isNewThread) {
            const threadIdEvent = `data: ${JSON.stringify({
              type: "threadId",
              threadId: threadId,
              temporary: skipDatabaseOperations,
              databaseStatus: databaseStatus,
            })}\n\n`;
            controller.enqueue(encoder.encode(threadIdEvent));
            console.log(`Sent initial threadId event for ${threadId}`);
          }

          // Add null check before accessing getReader
          if (!pythonResponse.body) {
            console.error("Stream body is null after check?");
            controller.error(new Error("Response body is null"));
            return;
          }

          const reader = pythonResponse.body.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log(`Stream completed for thread ${threadId}`);
                break;
              }

              // Process the incoming chunk and send it to the client
              const chunk = new TextDecoder().decode(value);
              controller.enqueue(encoder.encode(chunk));
            }
          } catch (error) {
            console.error(
              `Error reading stream for thread ${threadId}:`,
              error
            );
            const errorMsg = `data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : String(error),
            })}\n\n`;
            controller.enqueue(encoder.encode(errorMsg));
          } finally {
            console.log(`Closing stream for thread ${threadId}`);
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (langserveError) {
      console.error("Error calling LangServe:", langserveError);
      return NextResponse.json(
        {
          error: "Failed to communicate with AI service",
          details:
            langserveError instanceof Error
              ? langserveError.message
              : String(langserveError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in API route handler:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}
