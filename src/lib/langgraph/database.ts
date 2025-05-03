import { supabase } from "../supabase";
import { User } from "@clerk/nextjs/server";
import { Message } from "./types";

// Create Supabase client
const createSupabaseClient = () => {
  return supabase;
};

// Create a new thread
export async function createConversation(
  mode: string,
  title: string,
  clerkUser: User | null | undefined
): Promise<{ id: string; error?: string }> {
  try {
    // If no authenticated user, return a temporary thread
    if (!clerkUser?.id) {
      const tempId = crypto.randomUUID();
      console.log("No authenticated user, creating temporary thread");
      return { id: `temp-${tempId}` };
    }

    console.log("Creating conversation for Clerk user ID:", clerkUser.id);

    // Get profile directly - simpler and more reliable than RPC
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", clerkUser.id)
      .single();

    console.log("Profile lookup result:", { profile, error: profileError });

    // If profile doesn't exist, try to create one
    let profileId: string | undefined;

    if (profileError || !profile) {
      console.log("Profile not found, attempting to create one");

      const { data: newProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          clerk_id: clerkUser.id,
          full_name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : "Anonymous",
          email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
        })
        .select("id")
        .single();

      console.log("Profile creation result:", {
        newProfile,
        error: createProfileError,
      });

      if (createProfileError || !newProfile) {
        return {
          id: `temp-${crypto.randomUUID()}`,
          error: `Failed to create profile: ${
            createProfileError?.message || "Unknown error"
          }`,
        };
      }

      // Use the newly created profile
      profileId = newProfile.id;
    } else {
      // Use the existing profile
      profileId = profile.id;
    }

    // Create the thread with the retrieved profile_id
    const threadId = crypto.randomUUID();
    console.log("Creating thread with profile_id:", profileId);

    const { error: threadError } = await supabase.from("threads").insert({
      id: threadId,
      profile_id: profileId,
      clerk_id: clerkUser.id,
      mode: mode,
      title: title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (threadError) {
      console.error("Error creating thread in Supabase:", threadError);
      return {
        id: `temp-${threadId}`,
        error: `Failed to create thread: ${threadError.message}`,
      };
    }

    return { id: threadId };
  } catch (error) {
    console.error("Exception in createConversation:", error);
    return {
      id: `temp-${crypto.randomUUID()}`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Save a message to the database
export async function saveMessage(
  threadId: string,
  message: { role: string; content: string }
): Promise<void> {
  console.log(`--- ENTERING saveMessage for thread: ${threadId} ---`); // Log entry
  // Don't save messages for temporary threads
  if (threadId.startsWith("temp-")) {
    console.log("Skipping message save for temporary thread:", threadId);
    return;
  }

  try {
    console.log(`[saveMessage] Inserting message for thread: ${threadId}`);
    // Fields 'created_at' and 'updated_at' now have database defaults
    const { error } = await supabase.from("messages").insert({
      thread_id: threadId,
      role: message.role,
      content: message.content,
      // created_at: new Date().toISOString(), // Removed, handled by DB default
    });

    if (error) {
      console.error(
        `[saveMessage] Error saving message for thread ${threadId}:`,
        error
      );
    } else {
      console.log(
        `[saveMessage] Successfully saved message for thread ${threadId}`
      );
    }
  } catch (error) {
    console.error(
      `[saveMessage] Exception saving message for thread ${threadId}:`,
      error
    );
  }
}

// Save a preview to the database
export async function savePreview(
  threadId: string,
  previewData: {
    content: string;
    metadata?: any;
    chat_content?: string;
    presentation_content?: string;
    status_messages?: any;
    current_step?: number;
  }
): Promise<string | undefined> {
  console.log(`--- ENTERING savePreview for thread: ${threadId} ---`); // Log entry
  // Don't save previews for temporary threads
  if (threadId.startsWith("temp-")) {
    console.log("Skipping preview save for temporary thread:", threadId);
    return undefined;
  }

  const previewId = crypto.randomUUID(); // Generate ID for the preview

  try {
    // Fields 'created_at' and 'updated_at' now have database defaults
    // 'message_id' column removed from table schema
    const { error } = await supabase.from("message_previews").insert({
      id: previewId,
      thread_id: threadId,
      content: previewData.content,
      // Add other optional fields if provided
      chat_content: previewData.chat_content,
      presentation_content: previewData.presentation_content,
      content_metadata: previewData.metadata,
      status_messages: previewData.status_messages,
      current_step: previewData.current_step,
      // updated_at: new Date().toISOString(), // Removed, handled by DB trigger
      // Assuming message_id might link to the *triggering* user message, which we don't easily have here
      // It might be better to remove the message_id FK or handle it differently -> Removed from schema
    });

    if (error) {
      console.error("Error saving message preview:", error);
      return undefined; // Indicate failure
    } else {
      console.log(
        `Successfully saved preview ${previewId} for thread ${threadId}`
      );
      return previewId; // Return the generated ID
    }
  } catch (error) {
    console.error("Exception in savePreview:", error);
    return undefined;
  }
}

// Get messages for a thread
export async function getConversationMessages(threadId: string) {
  // Don't try to fetch messages for temporary threads
  if (threadId.startsWith("temp-")) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception in getConversationMessages:", error);
    return [];
  }
}
