import { NextRequest } from "next/server";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase";
import {
  createConversation,
  saveMessage,
  getConversationMessages,
} from "@/lib/langgraph/database";
import { currentUser, type User } from "@clerk/nextjs/server";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Get the current user from Clerk with error handling
    let user: User | null | undefined;
    let clerkId: string | undefined;

    try {
      user = await currentUser();
      clerkId = user?.id;
    } catch (authError) {
      console.warn("Error authenticating with Clerk:", authError);
      // Continue in dev mode without authentication
      if (process.env.NODE_ENV !== "development") {
        clerkId = undefined;
      }
    }

    if (!clerkId && process.env.NODE_ENV !== "development") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { prompt, threadId: existingThreadId, settings = {} } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    // Determine thread ID: use existing or create new
    let threadId = existingThreadId;
    const isNewThread = !existingThreadId;

    // If no thread ID, create a new conversation
    if (isNewThread) {
      try {
        // Generate a title based on the input
        const title =
          prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt;

        // Create a new conversation
        const result = await createConversation("student", title, user);

        if (result.error) {
          console.warn(`Failed to create conversation: ${result.error}`);
          threadId = `temp-${crypto.randomUUID()}`;
        } else {
          threadId = result.id;
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        threadId = `temp-${crypto.randomUUID()}`;
      }
    }

    console.log(`--- V1 API Request ---`);
    console.log(`Thread ID: ${threadId} (${isNewThread ? "New" : "Existing"})`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`Settings: ${JSON.stringify(settings)}`);
    console.log(`-------------------`);

    // Save the user message if we have a valid thread ID
    if (threadId && !threadId.startsWith("temp-")) {
      await saveMessage(threadId, { role: "user", content: prompt });
    }

    // Fetch conversation history if available
    let conversationHistory: any[] = [];
    if (threadId && !threadId.startsWith("temp-")) {
      try {
        const messages = await getConversationMessages(threadId);
        if (messages && messages.length > 0) {
          conversationHistory = messages;
        }
      } catch (error) {
        console.error("Error fetching conversation history:", error);
      }
    }

    // Convert conversation history to OpenAI format
    const formattedHistory = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })) as { role: "user" | "assistant" | "system"; content: string }[];

    // Retrieve relevant context from standard_content table
    let relevantContent = "";
    try {
      // Use text-embedding-3-small for embedding
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: prompt,
        encoding_format: "float",
      });

      // Query Supabase vector store for relevant content
      const { data: matches, error } = await supabase.rpc(
        "match_standard_content",
        {
          query_embedding: embeddingResponse.data[0].embedding,
          match_threshold: 0.7,
          match_count: 5,
        }
      );

      if (error) {
        console.error("Error searching vector store:", error);
      } else if (matches && matches.length > 0) {
        relevantContent = matches
          .map(
            (match: any) =>
              `CONTENT (${match.source}, similarity: ${match.similarity.toFixed(
                2
              )}):\n${match.content}`
          )
          .join("\n\n");
      }
    } catch (error) {
      console.error("Error retrieving vector embeddings:", error);
    }

    // Build the system prompt with context if available
    let systemPrompt =
      "You are a helpful AI assistant specializing in mathematics education. Provide clear, accurate, and educational responses.";

    if (relevantContent) {
      systemPrompt += `\n\nUse the following reference material to inform your answers:\n\n${relevantContent}`;
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send the threadId first if it's a new thread
        if (isNewThread) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "threadId", threadId })}\n\n`
            )
          );
        }

        // Send streaming status update
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "status",
              message: "Thinking...",
            })}\n\n`
          )
        );

        try {
          // Set up messages array for OpenAI API
          const messages = [
            { role: "system" as const, content: systemPrompt },
            ...formattedHistory,
            { role: "user" as const, content: prompt },
          ];

          // Call OpenAI API with streaming
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            stream: true,
          });

          // Store the complete response to save later
          let completeResponse = "";

          // Stream the chunks to the client
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";

            if (content) {
              completeResponse += content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "content",
                    content,
                    isComplete: false,
                  })}\n\n`
                )
              );
            }
          }

          // Send completed message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "content",
                content: "",
                isComplete: true,
              })}\n\n`
            )
          );

          // Save the assistant's response
          if (threadId && !threadId.startsWith("temp-") && completeResponse) {
            await saveMessage(threadId, {
              role: "assistant",
              content: completeResponse,
            });
          }
        } catch (error) {
          console.error("Error generating response:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
              })}\n\n`
            )
          );
        } finally {
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
