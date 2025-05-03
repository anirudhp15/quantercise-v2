"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserProfile, createUserProfile } from "../supabase";

type UserProfile = {
  id: string;
  clerk_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export function useClerkSupabase() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!isLoaded || !isSignedIn || !user?.id) return;

      setIsLoadingProfile(true);
      setError(null);

      try {
        console.log("Fetching profile for user:", {
          userId: user.id,
          fullName: user.fullName,
          hasImage: !!user.imageUrl,
        });

        // Try to get existing profile
        let userProfile = await getUserProfile(user.id);

        // If no profile exists, create one
        if (!userProfile) {
          console.log("No profile found, creating new profile");
          userProfile = await createUserProfile(user.id, {
            full_name: user.fullName || undefined,
            avatar_url: user.imageUrl || undefined,
          });
        }

        if (!userProfile) {
          throw new Error("Failed to create or fetch user profile");
        }

        console.log("Successfully loaded profile:", userProfile);
        setProfile(userProfile);
      } catch (err) {
        console.error("Error in useClerkSupabase:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load user profile";
        setError(new Error(errorMessage));
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchUserProfile();
  }, [user?.id, isLoaded, isSignedIn, user?.fullName, user?.imageUrl]);

  return {
    user, // Clerk user
    profile, // Supabase profile
    isLoaded, // Clerk loaded state
    isLoadingProfile, // Supabase profile loading state
    error, // Any errors that occurred
    isSignedIn, // Whether the user is signed in
  };
}
