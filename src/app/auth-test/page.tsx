"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthTestPage() {
  const [status, setStatus] = useState("Checking auth status...");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          setStatus("Authenticated");
          setUserInfo(data.session.user);
          setSessionInfo(data.session);
          console.log("[AuthTest] Session found:", data.session);

          // Check for proper cookies
          console.log("[AuthTest] Document cookies:", document.cookie);
        } else {
          setStatus("Not authenticated");
          console.log("[AuthTest] No session found");
        }
      } catch (err: any) {
        setStatus("Error checking auth");
        setError(err.message);
        console.error("[AuthTest] Auth check error:", err);
      }
    }

    checkAuth();
  }, []);

  const handleManualSignIn = async () => {
    try {
      setSignInError(null);
      // First sign out to ensure clean state
      await supabase.auth.signOut();

      console.log("[AuthTest] Attempting sign in with ap7564@nyu.edu");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "ap7564@nyu.edu",
        password: "password123", // Replace with the actual password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("[AuthTest] Sign-in successful:", data.user);
        console.log("[AuthTest] Session:", data.session);

        setStatus("Manually signed in");
        setUserInfo(data.user);
        setSessionInfo(data.session);

        // Wait for cookies to be set
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Force page reload to ensure cookies take effect
        window.location.reload();
      }
    } catch (err: any) {
      setSignInError(err.message);
      console.error("[AuthTest] Manual sign-in error:", err);
    }
  };

  const handleSignOut = async () => {
    console.log("[AuthTest] Signing out");
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-gray-800 p-8 rounded-lg">
        <h1 className="text-2xl font-bold text-white">Supabase Auth Test</h1>

        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded">
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <p className="text-green-400">{status}</p>
            {error && <p className="text-red-400 mt-2">Error: {error}</p>}
          </div>

          {userInfo && (
            <div className="bg-gray-700 p-4 rounded">
              <h2 className="text-lg font-semibold text-white">User Info</h2>
              <pre className="text-xs text-green-300 mt-2 overflow-auto max-h-48">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
          )}

          {sessionInfo && (
            <div className="bg-gray-700 p-4 rounded">
              <h2 className="text-lg font-semibold text-white">Session Info</h2>
              <p className="text-xs text-green-300">
                Created at: {new Date(sessionInfo.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-green-300">
                Expires at:{" "}
                {new Date(sessionInfo.expires_at * 1000).toLocaleString()}
              </p>
              <div className="mt-2 p-2 bg-gray-800 rounded">
                <p className="text-xs font-medium text-gray-300">Session ID:</p>
                <p className="text-xs overflow-auto text-gray-400 break-all">
                  {sessionInfo.access_token?.substring(0, 20)}...
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            {!userInfo ? (
              <Button
                onClick={handleManualSignIn}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Test Sign In (ap7564@nyu.edu)
              </Button>
            ) : (
              <Button
                onClick={handleSignOut}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </Button>
            )}
          </div>

          {signInError && (
            <p className="text-red-400 mt-2">Sign-in Error: {signInError}</p>
          )}

          <div className="mt-4 flex justify-center flex-col space-y-3">
            {userInfo && (
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            )}

            <Link href="/">
              <Button
                variant="outline"
                className="w-full text-white border-gray-600"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
