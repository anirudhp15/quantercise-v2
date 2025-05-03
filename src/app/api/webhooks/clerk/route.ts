import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUserProfile } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Get the headers
  const headersList = headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, first_name, last_name, image_url } = evt.data;

    try {
      // Sync user to Supabase
      await createUserProfile(id, {
        full_name: `${first_name || ""} ${last_name || ""}`.trim(),
        avatar_url: image_url,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error creating user profile:", error);
      return NextResponse.json(
        { success: false, error: "Failed to sync user data" },
        { status: 500 }
      );
    }
  }

  // Return a success response for other events
  return NextResponse.json({ success: true });
}
