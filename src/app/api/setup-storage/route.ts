import { NextResponse } from "next/server";
import { setupChatImagesBucket } from "@/lib/supabase";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  // Security check - only allow admin users to run this
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const success = await setupChatImagesBucket();

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Storage bucket set up successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to set up storage bucket" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in setup-storage endpoint:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
