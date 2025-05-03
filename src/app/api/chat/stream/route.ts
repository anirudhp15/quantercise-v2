import { NextRequest } from "next/server";
import { app } from "@/lib/langgraph/graph"; // Import the compiled graph
import { RunnableConfig } from "@langchain/core/runnables";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { v4 as uuidv4 } from "uuid";

export const runtime = "edge"; // Use edge runtime for streaming

export async function POST(req: NextRequest) {
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === "development";

    // Get the current user from auth header if not in dev mode
    if (!isDev) {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      }
    }

    const body = await req.json();
    const {
      prompt,
      threadId: existingThreadId,
      settings = {}, // Grade level, tone, etc.
      imageData, // Optional image data { base64, contentType, filename, size }
      // History is no longer needed from frontend, managed by checkpointer
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    // Determine thread ID: use existing or create new
    const threadId = existingThreadId || uuidv4();
    const isNewThread = !existingThreadId;

    console.log(`--- API Request ---`);
    console.log(`Thread ID: ${threadId} (${isNewThread ? "New" : "Existing"})`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`Settings: ${JSON.stringify(settings)}`);
    console.log(`Image Provided: ${!!imageData}`);
    console.log(`-------------------`);

    // Prepare initial state for the graph
    // Note: Checkpointer will load existing messages for the threadId automatically
    const initialState = {
      messages: [], // Checkpointer handles loading history
      userInput: prompt,
      settings: settings,
      // Add image handling if needed - graph state might need modification
      // Example: If image data is present, add it to the initial message list or a dedicated state field
    };
    if (imageData) {
      // TODO: Modify graph state/nodes to handle image input if required
      // Example: Add to the initial human message or a specific 'image' field
      console.warn(
        "Image data received but graph state/nodes might need updates to handle it."
      );
      // initialState.messages = [new HumanMessage({ content: [{ type: "text", text: prompt }, { type: "image_url", image_url: `data:${imageData.contentType};base64,${imageData.base64}` }] })];
      // initialState.userInput = ""; // Clear text prompt if image is the main input? Depends on design.
    }

    // Configuration for the graph run, including the thread ID for persistence
    const config: RunnableConfig = {
      configurable: {
        thread_id: threadId,
      },
    };

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Function to enqueue data chunks
        const enqueue = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        // If it's a new thread, send the threadId back immediately
        if (isNewThread) {
          enqueue({ type: "threadId", threadId: threadId });
        }

        try {
          console.log("Starting graph stream for thread:", threadId);
          // Stream events from the graph execution
          for await (const event of await app.stream(initialState, config)) {
            // console.log("Raw Graph Event:", event); // DEBUG: Log all events

            // Check for custom events yielded by nodes
            if (
              event?.event === "on_chain_stream" &&
              event.name?.startsWith("custom_")
            ) {
              try {
                // Custom events payload is nested in event.data.chunk
                const customData = JSON.parse(event.data.chunk as string);
                console.log(
                  "[Stream API] Detected Yielded Event:",
                  customData.type
                ); // Log detection
                enqueue(customData); // Send immediately
              } catch (e) {
                console.error(
                  "Error parsing custom stream event:",
                  e,
                  event.data.chunk
                );
              }
            }
            // You could potentially extract standard LLM stream tokens here too if needed,
            // but the current design relies on the 'chat' custom event for chat output.
            // Example:
            // else if (event?.event === "on_llm_stream" && event.name === 'ChatOpenAI') {
            //    const content = event.data?.chunk?.message?.content;
            //    if (content) {
            //       // This might interfere with the dedicated chat_responder stream, use carefully
            //       // enqueue({ type: "llm_chunk", content: content });
            //    }
            // }
          }
          console.log("Graph stream finished for thread:", threadId);
        } catch (error) {
          console.error(
            `Error during graph execution for thread ${threadId}:`,
            error
          );
          enqueue({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "An internal error occurred",
          });
        } finally {
          controller.close();
          console.log("Stream closed for thread:", threadId);
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
