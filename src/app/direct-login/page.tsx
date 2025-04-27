"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DirectLoginPage() {
  const [message, setMessage] = useState("Preparing to sign in...");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  const email = "ap7564@nyu.edu";
  // Replace with the actual password
  const password = "password123";

  useEffect(() => {
    // Check if already signed in
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        setMessage(`Already signed in as ${data.session.user.email}!`);
        setSession(data.session);
        console.log("[DirectLogin] Existing session found:", data.session);
      } else {
        setMessage("Not signed in. Ready to attempt login.");
        console.log("[DirectLogin] No session found");
      }
    }

    checkSession();
  }, []);

  const handleDirectLogin = async () => {
    try {
      setMessage("Attempting to sign in...");
      setError(null);

      // Clear any existing session first
      await supabase.auth.signOut();
      console.log("[DirectLogin] Signed out existing session");

      // Wait a moment to ensure signout is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Sign in with the test user
      console.log("[DirectLogin] Attempting sign in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log("[DirectLogin] Sign-in successful:", data.user);
        console.log("[DirectLogin] Session:", data.session);

        setMessage(`Successfully signed in as ${data.user.email}`);
        setSession(data.session);

        // Wait longer to ensure cookies are set
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Get session to verify it was established
        const refreshResult = await supabase.auth.getSession();
        console.log(
          "[DirectLogin] Refreshed session check:",
          !!refreshResult.data.session
        );

        if (refreshResult.data.session) {
          // Use window.location for a full page load instead of client routing
          window.location.href = "/dashboard";
        } else {
          setError("Session wasn't properly established. Please try again.");
        }
      }
    } catch (err: any) {
      setError(`Error signing in: ${err.message}`);
      console.error("[DirectLogin] Sign-in error:", err);
    }
  };

  const goToDashboard = () => {
    // Use window.location for a full page load
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-gray-800 p-8 rounded-lg">
        <h1 className="text-2xl font-bold text-white">Direct Login Test</h1>

        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-green-400">{message}</p>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </div>

          {session ? (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded">
                <h2 className="text-lg font-semibold text-white">
                  Session Info
                </h2>
                <p className="text-xs text-green-300 mt-2">
                  User ID: {session.user?.id}
                </p>
                <p className="text-xs text-green-300">
                  Email: {session.user?.email}
                </p>
                <p className="text-xs text-green-300 mt-2">
                  Created at: {new Date(session.created_at).toLocaleString()}
                </p>
                <p className="text-xs text-green-300">
                  Expires at:{" "}
                  {new Date(session.expires_at * 1000).toLocaleString()}
                </p>
              </div>

              <Button
                onClick={goToDashboard}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleDirectLogin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign In as {email}
            </Button>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              className="text-white border-gray-600"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>

            <Button
              variant="outline"
              className="text-white border-red-600 hover:bg-red-900/20"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
