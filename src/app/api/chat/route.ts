import { OpenAI } from "openai";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Define basic types for Supabase database
interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          mode: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at: string;
        };
      };
    };
  };
}

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Custom implementation of StreamingTextResponse
class StreamingTextResponse extends Response {
  constructor(
    stream: ReadableStream,
    options: {
      status?: number;
      headers?: Record<string, string>;
      onCompletion?: (text: string) => void | Promise<void>;
    } = {}
  ) {
    const { status = 200, headers = {}, onCompletion } = options;

    // Create a TransformStream to collect the full response for onCompletion
    let fullText = "";
    const textEncoder = new TextEncoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullText += text;
        controller.enqueue(chunk);
      },
      flush(controller) {
        if (onCompletion) {
          // Need to execute this asynchronously since flush can't be async
          Promise.resolve(onCompletion(fullText)).catch(console.error);
        }
      },
    });

    // Set default headers for streaming text
    const responseHeaders = {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    };

    // Pipe the original stream through our transform stream
    const modifiedStream = stream.pipeThrough(transformStream);

    super(modifiedStream, {
      status,
      headers: responseHeaders,
    });
  }
}

// Utility to convert OpenAI stream to ReadableStream
function OpenAIStream(response: any): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        console.error("Error in stream processing:", error);
        controller.error(error);
      }
    },
  });
}

export async function POST(req: Request) {
  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing conversationId or message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;

    // Verify if the conversation belongs to the authenticated user
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .single();

    if (conversationError || !conversation) {
      return new Response(
        JSON.stringify({
          error: "Conversation not found or does not belong to the user",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert the user's message into the database
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    // Retrieve all messages for the conversation to maintain context
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return new Response(
        JSON.stringify({ error: "Failed to retrieve messages" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate a system message based on the conversation mode
    let systemMessage = "";
    if (conversation.mode === "student") {
      systemMessage =
        "You are a helpful tutor assisting a student with their quantitative exercises and learning. Focus on explaining mathematical concepts clearly and providing step-by-step guidance without giving away complete solutions. Encourage critical thinking.";
    } else if (conversation.mode === "teacher") {
      systemMessage =
        "You are a helpful assistant for teachers, helping them create educational content, develop lesson plans, and design assessments for quantitative subjects. Provide pedagogical strategies and suggest ways to explain complex concepts.";
    } else {
      systemMessage =
        "You are a helpful assistant focused on mathematics and quantitative subjects.";
    }

    // Prepare messages for the OpenAI API call
    const openaiMessages = [
      { role: "system", content: systemMessage },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
    ];

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: openaiMessages as any, // Type assertion to avoid TypeScript error
      stream: true,
    });

    // Create a stream for the response
    const stream = OpenAIStream(response);

    // Helper function for the stream that will save the completion to the database
    async function saveCompletion(completion: string) {
      // Save the assistant's response back to the database
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: completion,
      });

      // Update the conversation's timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    // Return the streaming response
    return new StreamingTextResponse(stream, {
      onCompletion: saveCompletion,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
