import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create the Supabase client with persistent sessions
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "sb-auth-token",
    detectSessionInUrl: true,
    flowType: "pkce",
    // These are the correct options for Supabase v2
    storage: {
      getItem: (key) => {
        if (typeof window !== "undefined") {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key, value) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key) => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(key);
        }
      },
    },
  },
  global: {
    headers: {
      "X-Client-Info": "quantercise-app",
    },
  },
});
