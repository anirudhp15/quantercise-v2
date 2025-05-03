import { NextRequest, NextResponse } from "next/server";
import { LessonSettings } from "@/types";
import { currentUser } from "@clerk/nextjs/server"; // Import Clerk's server-side helper

export const runtime = "edge";

export interface ChatRequest {
  message: string;
  threadId?: string;
  images?: Array<{ path: string; type: string; name: string }>;
  mode?: "student" | "teacher";
  settings?: LessonSettings;
  useV1?: boolean; // New flag to explicitly use v1 endpoint
}

export async function POST(req: NextRequest) {
  try {
    // Get the current user securely on the server-side
    let user;
    try {
      user = await currentUser();
    } catch (authError) {
      console.warn("[DEV] Bypassing auth for non-critical API route:", req.url);
      // Continue in dev mode, but user will be undefined
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Authentication error" },
          { status: 401 }
        );
      }
    }

    const clerkId = user?.id;

    if (!clerkId && process.env.NODE_ENV !== "development") {
      // If no user is found in production, return an authentication error
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const requestData = requestBody as ChatRequest;
    const {
      message,
      threadId,
      images,
      mode = "student",
      settings,
      useV1 = false, // Default to false - prefer v2 endpoint
    } = requestData;

    // If v1 is explicitly requested, use the v1 handler
    if (useV1) {
      // Import the v1 handler
      const v1Module = await import("./v1/route");

      // Create the v1 request body
      const v1Body = JSON.stringify({
        prompt: message,
        threadId,
        settings,
      });

      // Directly call the v1 handler with modified body
      return v1Module.POST(
        new NextRequest(req.url, {
          method: "POST",
          headers: req.headers,
          body: v1Body,
        })
      );
    }

    // Try using v2 first
    try {
      // Import the v2 handler
      const v2Module = await import("./v2/route");

      // Create the v2 request body
      const v2Body = JSON.stringify({
        message,
        threadId,
        images,
        mode,
        settings,
      });

      // Call the v2 handler with modified body
      return await v2Module.POST(
        new NextRequest(req.url, {
          method: "POST",
          headers: req.headers,
          body: v2Body,
        })
      );
    } catch (v2Error) {
      console.error("Error with v2 endpoint, falling back to v1:", v2Error);

      // Fall back to v1 - import the handler
      const v1Module = await import("./v1/route");

      // Create the v1 request body
      const v1Body = JSON.stringify({
        prompt: message,
        threadId,
        settings,
      });

      // Call the v1 handler with modified body
      return v1Module.POST(
        new NextRequest(req.url, {
          method: "POST",
          headers: req.headers,
          body: v1Body,
        })
      );
    }
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
