import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/../types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create a Supabase client for database operations only (not auth)
// Added Edge compatibility options for better reliability in Edge runtime
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Add retry handling for fetch calls
      fetch: async (url, options = {}) => {
        const MAX_RETRIES = 3;
        let retryCount = 0;

        while (retryCount < MAX_RETRIES) {
          try {
            const response = await fetch(url, options);
            return response;
          } catch (error) {
            retryCount += 1;

            // Only retry on network/fetch failures
            if (
              error instanceof Error &&
              error.message.includes("fetch failed") &&
              retryCount < MAX_RETRIES
            ) {
              console.warn(
                `Supabase fetch attempt ${retryCount} failed, retrying...`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, 500 * retryCount)
              ); // Exponential backoff
            } else {
              // Re-throw the error after all retries failed
              throw error;
            }
          }
        }

        // This should never be reached due to the throw in the catch block,
        // but TypeScript needs a return value
        return null as any;
      },
    },
  }
);

// Create an admin client with the service role key for operations that need to bypass RLS
// Added Edge compatibility and retry options
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Add retry handling for fetch calls
        fetch: async (url, options = {}) => {
          const MAX_RETRIES = 3;
          let retryCount = 0;

          while (retryCount < MAX_RETRIES) {
            try {
              const response = await fetch(url, options);
              return response;
            } catch (error) {
              retryCount += 1;

              // Only retry on network/fetch failures
              if (
                error instanceof Error &&
                error.message.includes("fetch failed") &&
                retryCount < MAX_RETRIES
              ) {
                console.warn(
                  `Supabase admin fetch attempt ${retryCount} failed, retrying...`
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 500 * retryCount)
                ); // Exponential backoff
              } else {
                // Re-throw the error after all retries failed
                throw error;
              }
            }
          }

          // This should never be reached due to the throw in the catch block,
          // but TypeScript needs a return value
          return null as any;
        },
      },
    })
  : supabase; // Fallback to regular client if service key is not available

/**
 * Helper function to create a user profile in Supabase linked to a Clerk user
 */
export async function createUserProfile(
  clerkId: string,
  userData: {
    full_name?: string;
    avatar_url?: string;
  }
) {
  if (!clerkId) {
    throw new Error("Clerk ID is required");
  }

  try {
    console.log("Checking for existing profile with clerk_id:", clerkId);

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", clerkId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking for existing profile:", checkError);
      throw checkError;
    }

    if (existingProfile) {
      console.log("Updating existing profile for clerk_id:", clerkId);

      // Update existing profile
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", clerkId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      console.log("Successfully updated profile:", data);
      return data;
    } else {
      console.log("Creating new profile for clerk_id:", clerkId);

      // Create new profile
      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          clerk_id: clerkId,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        throw insertError;
      }

      console.log("Successfully created profile:", data);
      return data;
    }
  } catch (error) {
    console.error("Error managing user profile:", {
      error,
      clerkId,
      userData,
    });
    throw error;
  }
}

/**
 * Helper function to get a user profile by Clerk ID
 */
export async function getUserProfile(clerkId: string) {
  if (!clerkId) {
    throw new Error("Clerk ID is required");
  }

  try {
    console.log("Fetching profile for clerk_id:", clerkId);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", clerkId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("No profile found for clerk_id:", clerkId);
        return null;
      }
      console.error("Error fetching profile:", error);
      throw error;
    }

    console.log("Successfully fetched profile:", data);
    return data;
  } catch (error) {
    console.error("Error getting user profile:", {
      error,
      clerkId,
    });
    throw error;
  }
}

/**
 * Setup storage bucket for chat images with proper permissions
 * Call this function from an admin endpoint or during app initialization
 */
export async function setupChatImagesBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketError } =
      await supabaseAdmin.storage.listBuckets();

    let bucketExists = false;
    if (buckets) {
      bucketExists = buckets.some((bucket) => bucket.name === "chat-images");
    }

    // Create bucket if it doesn't exist
    if (!bucketExists) {
      const { data, error } = await supabaseAdmin.storage.createBucket(
        "chat-images",
        {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp",
          ],
        }
      );

      if (error) {
        console.error("Error creating chat-images bucket:", error);
        return false;
      }

      console.log("Successfully created chat-images bucket");
    } else {
      console.log("chat-images bucket already exists");
    }

    return true;
  } catch (error) {
    console.error("Error setting up chat-images bucket:", error);
    return false;
  }
}
