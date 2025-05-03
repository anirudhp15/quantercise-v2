import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Get the current user securely on the server-side
    const user = await currentUser();

    // Only admins can access LangSmith traces
    if (!user || !user.publicMetadata.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get the trace ID from the query parameter
    const url = new URL(req.url);
    const traceId = url.searchParams.get("traceId");

    if (!traceId) {
      return NextResponse.json(
        { error: "Trace ID is required" },
        { status: 400 }
      );
    }

    // Get the LangSmith API key from environment variables
    const langsmithApiKey = process.env.LANGSMITH_API_KEY;

    if (!langsmithApiKey) {
      return NextResponse.json(
        { error: "LangSmith API key not configured" },
        { status: 500 }
      );
    }

    // Forward the request to LangSmith API
    const response = await fetch(
      `https://api.smith.langchain.com/runs/${traceId}`,
      {
        headers: {
          Authorization: `Bearer ${langsmithApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch trace: ${response.statusText}` },
        { status: response.status }
      );
    }

    const traceData = await response.json();

    return NextResponse.json({ trace: traceData });
  } catch (error) {
    console.error("Error fetching trace:", error);
    return NextResponse.json(
      { error: "Failed to fetch trace data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the current user securely on the server-side
    const user = await currentUser();

    // Only admins can access LangSmith traces
    if (!user || !user.publicMetadata.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { message, settings } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Forward the request to the v2 endpoint with test mode enabled
    const response = await fetch(`${req.nextUrl.origin}/api/chat/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LangSmith-Test-Mode": "true",
        // Pass through auth headers
        Cookie: req.headers.get("cookie") || "",
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify({
        message,
        settings: settings || {
          contentType: "worksheet",
          gradeLevel: "8",
          length: "standard",
          tone: "academic",
        },
        testMode: true,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Test run failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      result,
      message: "Test run completed successfully",
      langsmithUrl: `https://smith.langchain.com/project/${process.env.LANGSMITH_PROJECT_ID}`,
    });
  } catch (error) {
    console.error("Error running test:", error);
    return NextResponse.json({ error: "Failed to run test" }, { status: 500 });
  }
}
