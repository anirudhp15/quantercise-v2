import { NextResponse } from "next/server";
import { streamMultiAgentChat } from "@/lib/langgraph/multi-agent";

export const runtime = "edge";

// Interface to match the request structure for the JS implementation
interface LangGraphRequest {
  history?: Array<{ role: string; content: string }>;
  question?: string;
  mode?: "student" | "teacher";
  settings?: {
    contentType: string;
    gradeLevel: string;
    length: string;
    tone: string;
  };
}

export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "JS LangGraph API is running.",
    usingPython: false,
  });
}

export async function POST(req: Request) {
  try {
    const requestData: LangGraphRequest = await req.json();
    const { question, history = [], mode = "student", settings } = requestData;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("Attempting direct JS LangGraph processing");

          // Use the new JS-based implementation directly
          const chatStream = streamMultiAgentChat(question, history, {
            mode,
            structuredOutput: true,
            settings: settings || {
              contentType: "worksheet",
              gradeLevel: "8",
              length: "standard",
              tone: "academic",
            },
          });

          for await (const chunk of chatStream) {
            controller.enqueue(encoder.encode(`${chunk}\n`));
          }
        } catch (error) {
          console.error("Error in LangGraph JS processing:", error);
          const errorResponse = JSON.stringify({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unknown error during LangGraph processing",
          });
          controller.enqueue(encoder.encode(errorResponse + "\n"));
        } finally {
          console.log("Closing stream controller");
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in LangGraph API POST handler:", error);
    return NextResponse.json(
      { error: "Internal server error in API route" },
      { status: 500 }
    );
  }
}
