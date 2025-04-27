"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error loading session:", error);
        setError("Failed to load user session");
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[SignUp] Starting sign up process for:", {
        email,
        fullName,
      });

      // First, ensure we have a connection to Supabase
      try {
        const pingResult = await supabase.from("profiles").select("count");
        console.log("[SignUp] Connection test result:", pingResult);
      } catch (connErr) {
        console.error("[SignUp] Connection test failed:", connErr);
      }

      // Attempt to create the user
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        console.error("[SignUp] Auth signup error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user returned from signup");
      }

      console.log("[SignUp] User created successfully:", data.user.id);

      // Create profile entry with a delay to ensure the user is created in the database
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        // Check for existing profile first to avoid duplicate errors
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        console.log("[SignUp] Existing profile check:", existingProfile);

        if (existingProfile) {
          console.log("[SignUp] Profile already exists, skipping creation");
        } else {
          // Prepare profile data with proper types
          const newProfileData = {
            id: data.user.id,
            full_name: fullName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar_url: null,
          };

          console.log(
            "[SignUp] Attempting to create profile with data:",
            newProfileData
          );

          const { error: profileError, data: createdProfile } = await supabase
            .from("profiles")
            .insert(newProfileData)
            .select();

          if (profileError) {
            console.error("[SignUp] Profile creation error details:", {
              message: profileError.message,
              code: profileError.code,
              details: profileError.details,
              hint: profileError.hint,
            });
            throw profileError;
          }

          console.log("[SignUp] Profile created successfully:", createdProfile);
        }
      } catch (profileErr: any) {
        // Log detailed error information
        console.error("[SignUp] Error creating profile:", {
          error: profileErr,
          message: profileErr.message,
          details: profileErr.details,
          code: profileErr.code,
          hint: profileErr.hint,
        });

        // Set a more informative error message
        setError(
          `Error creating profile: ${
            profileErr.message ||
            profileErr.details ||
            JSON.stringify(profileErr)
          }`
        );

        // Continue regardless, since the auth account was created
        console.log("[SignUp] Continuing despite profile error");
      }

      // Redirect to verification page
      router.push("/auth/verification");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        JSON.stringify(error) ||
        "An unknown error occurred during sign up";
      console.error("[SignUp] Error in signup process:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[Auth] Attempting to sign in with:", email);

      // Clear any existing auth state
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn("[Auth] Error clearing previous session:", signOutError);
      }

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Auth] Sign-in error:", error);
        throw error;
      }

      if (!data.session) {
        throw new Error("No session returned after sign in");
      }

      console.log("[Auth] Sign-in successful");
      console.log("[Auth] User ID:", data.user?.id);

      // Update local state
      setSession(data.session);
      setUser(data.user);

      // Use direct browser navigation instead of Next.js router
      // This ensures a full page reload and proper cookie handling
      window.location.href = "/dashboard";
    } catch (error: any) {
      setError(error?.message || "Invalid email or password");
      console.error("[Auth] Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error: any) {
      setError(error?.message || "Error signing out");
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
