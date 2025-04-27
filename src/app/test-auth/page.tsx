"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TestAuth() {
  const { user, signOut } = useAuth();
  const [authStatus, setAuthStatus] = useState<{
    status: "loading" | "success" | "error";
    message: string;
  }>({
    status: "loading",
    message: "Testing authentication...",
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        // Test if we can get the session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          setAuthStatus({
            status: "success",
            message: "Authentication is working correctly! You are logged in.",
          });
        } else {
          setAuthStatus({
            status: "success",
            message:
              "Authentication is working correctly! You are not logged in.",
          });
        }
      } catch (error: any) {
        setAuthStatus({
          status: "error",
          message: `Authentication error: ${error.message}`,
        });
        console.error("Auth error:", error);
      }
    }

    checkAuth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900/50 p-8 backdrop-blur-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Authentication Test
        </h1>

        <div
          className={`mb-6 rounded-md p-4 ${
            authStatus.status === "loading"
              ? "bg-gray-700/50"
              : authStatus.status === "success"
              ? "bg-green-500/20"
              : "bg-red-500/20"
          }`}
        >
          <p
            className={`text-center ${
              authStatus.status === "loading"
                ? "text-gray-300"
                : authStatus.status === "success"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {authStatus.message}
          </p>
        </div>

        {user && (
          <div className="mb-6 rounded-md bg-blue-500/20 p-4">
            <h2 className="mb-2 text-lg font-semibold text-blue-300">
              User Info
            </h2>
            <div className="space-y-1 text-sm text-blue-200">
              <p>ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Created: {new Date(user.created_at).toLocaleString()}</p>
              <p>Email confirmed: {user.email_confirmed_at ? "Yes" : "No"}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {user ? (
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          ) : (
            <Link href="/auth/login" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Sign In
              </Button>
            </Link>
          )}

          <Link href="/" className="block w-full">
            <Button
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-800"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
