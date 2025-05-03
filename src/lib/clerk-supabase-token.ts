import { createClient } from "@supabase/supabase-js";
import { User } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
// Replace Node.js crypto with Web Crypto API which is available in edge runtimes
// import { randomUUID } from "crypto";

// Function to create a Supabase client for a specific Clerk user
export async function createSupabaseUserClient(clerkUser: User | null) {
  if (!clerkUser) {
    console.warn("No Clerk user provided, returning anonymous Supabase client");
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  try {
    // Create JWT with Clerk user information
    const jwt = await createJwtForSupabase(clerkUser);

    // Create Supabase client with custom auth
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }
    );
  } catch (error) {
    console.error("Error creating Supabase client with Clerk auth:", error);
    // Fall back to anonymous client
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
}

// Function to generate a UUID using Web Crypto API (available in all modern browsers and edge runtimes)
function generateUUID() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Set version (4) and variant (10xx) bits according to RFC 4122
  array[6] = (array[6] & 0x0f) | 0x40; // version 4
  array[8] = (array[8] & 0x3f) | 0x80; // variant 10xx

  // Convert to hex string in UUID format
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
}

// Create a JWT that Supabase can verify
async function createJwtForSupabase(clerkUser: User) {
  // Get the JWT secret from environment variables or use a fallback for development
  const SUPABASE_JWT_SECRET =
    process.env.SUPABASE_JWT_SECRET ||
    (process.env.NODE_ENV === "development"
      ? "super-secret-jwt-token-with-at-least-32-characters-long"
      : undefined);

  if (!SUPABASE_JWT_SECRET) {
    console.error(
      "SUPABASE_JWT_SECRET is not defined. Please add it to your environment variables."
    );
    throw new Error("SUPABASE_JWT_SECRET is not defined");
  }

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(SUPABASE_JWT_SECRET);

  // Create a payload with the appropriate claims
  const payload = {
    role: "authenticated",
    aud: "authenticated",
    sub: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || "",
    app_metadata: {
      provider: "clerk",
    },
    user_metadata: {
      clerk_id: clerkUser.id,
      full_name: clerkUser.fullName,
      avatar_url: clerkUser.imageUrl,
    },
  };

  // Sign the JWT
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setJti(generateUUID())
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey);

  return jwt;
}
