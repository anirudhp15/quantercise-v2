import { supabase } from "./supabase";

export async function getSupabaseUserId(
  clerkId: string | null
): Promise<string | null> {
  if (!clerkId) return null;

  try {
    // Call the database function to get or create mapping
    const { data, error } = await supabase.rpc("get_or_create_user_mapping", {
      p_clerk_id: clerkId,
    });

    if (error) {
      console.error("Error getting/creating user mapping:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception in getSupabaseUserId:", error);
    return null;
  }
}
