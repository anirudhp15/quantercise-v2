import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
    };
  };
}

// GET endpoint to retrieve user's conversations
export async function GET() {
  try {
    // Create a Supabase client with awaited cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check if the user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error(
        "Authentication error:",
        sessionError || "No session found"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Retrieve conversations for the user
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error retrieving conversations:", error);
      return NextResponse.json(
        { error: "Failed to retrieve conversations" },
        { status: 500 }
      );
    }

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error in conversations API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new conversation
export async function POST(req: Request) {
  try {
    const { mode, title } = await req.json();

    if (!mode || !["student", "teacher"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'student' or 'teacher'" },
        { status: 400 }
      );
    }

    // Create a Supabase client with awaited cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check if the user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error(
        "Authentication error:",
        sessionError || "No session found"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Create a new conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        mode,
        title: title || `New ${mode} conversation`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error in conversations API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
