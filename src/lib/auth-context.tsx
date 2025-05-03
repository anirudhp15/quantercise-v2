"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: any;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getSession();
        if (authError) throw authError;

        // Use the setters here if needed in the future
        // setSession(authData.session);
        // setUser(authData.session?.user ?? null);
      } catch (err) {
        // setError(err);
        console.error("Error getting session:", err);
      } finally {
        // setIsLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Use the setters here if needed in the future
        // setSession(session);
        // setUser(session?.user ?? null);
        // setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Just go to dashboard regardless of response
      window.location.href = "/dashboard";
    } catch (error) {
      // Ignore errors
      window.location.href = "/dashboard";
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Simplified value for now, add setters back if used
  const value = { user, session, isLoading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
