"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/../types/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DebugAuthPage() {
  const supabase = createClientComponentClient<Database>();
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageItems, setStorageItems] = useState<Record<string, string>>({});
  const [cookies, setCookies] = useState<string>("");
  const [status, setStatus] = useState("Loading session info...");
  const [repairStatus, setRepairStatus] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleSignIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/debug-auth`,
        },
      });
    } catch (err) {
      console.error("Error signing in:", err);
    }
  };

  const getLocalStorage = () => {
    if (typeof window !== "undefined") {
      const items: Record<string, string> = {};
      // Safe way to iterate through localStorage
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.includes("supabase") || key.includes("sb-"))) {
          const value = window.localStorage.getItem(key);
          if (value) {
            items[key] = value;
          }
        }
      }
      setStorageItems(items);
    }
  };

  const getCookies = () => {
    if (typeof window !== "undefined") {
      setCookies(document.cookie);
    }
  };

  const repairSession = async () => {
    try {
      setRepairStatus("Repairing session...");

      // First, try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      if (data.session) {
        setRepairStatus("Session refreshed successfully");
        setSession(data.session);

        // Force client-side navigation to ensure cookies are applied
        window.location.reload();
      } else {
        setRepairStatus("No session to refresh. Please sign in again.");
      }
    } catch (err: any) {
      setRepairStatus(`Repair failed: ${err.message}`);
    }
  };

  const clearAndSignOut = async () => {
    try {
      setRepairStatus("Clearing all auth data...");

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: "global" });

      // Clear localStorage items related to Supabase
      if (typeof window !== "undefined") {
        Object.keys(window.localStorage).forEach((key) => {
          if (key.includes("supabase") || key.includes("sb-")) {
            window.localStorage.removeItem(key);
          }
        });
      }

      setRepairStatus("Auth data cleared. Reloading page...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (err: any) {
      setRepairStatus(`Clear failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-3xl space-y-8 bg-gray-800 p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Auth Debugger</h1>
          <div className="space-x-2">
            <Button
              onClick={repairSession}
              className="bg-green-600 hover:bg-green-700"
            >
              Repair Session
            </Button>
            <Button
              onClick={clearAndSignOut}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear & Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Status</h2>
            <p
              className={
                status.includes("Error") ? "text-red-400" : "text-green-400"
              }
            >
              {status}
            </p>
          </div>

          <div className="space-x-2">
            <Button
              onClick={repairSession}
              className="bg-green-600 hover:bg-green-700"
            >
              Repair Session
            </Button>
            <Button
              onClick={clearAndSignOut}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear & Sign Out
            </Button>
          </div>
        </div>

        {repairStatus && (
          <div className="bg-blue-900/30 border border-blue-700 p-4 rounded">
            <p className="text-blue-400">{repairStatus}</p>
          </div>
        )}

        {loading ? (
          <div>Loading auth state...</div>
        ) : error ? (
          <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex gap-3">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                >
                  Sign In with Google
                </button>
              )}
            </div>

            <div className="bg-gray-100 p-4 rounded-md mb-6">
              <h2 className="font-semibold mb-2">Auth Status</h2>
              <p className="mb-2">
                <span className="font-medium">Authenticated:</span>{" "}
                {user ? "Yes" : "No"}
              </p>
            </div>

            {user && (
              <div className="mb-6">
                <h2 className="font-semibold mb-2">User Information</h2>
                <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {session && (
              <div>
                <h2 className="font-semibold mb-2">Session Details</h2>
                <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-white mb-2">
            Browser Storage
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-white">Cookies</h3>
              {cookies ? (
                <pre className="mt-1 p-2 bg-gray-800 rounded overflow-auto max-h-24 text-xs text-gray-300">
                  {cookies.split("; ").join("\n")}
                </pre>
              ) : (
                <p className="text-yellow-400 text-sm">No cookies found</p>
              )}
            </div>

            <div>
              <h3 className="text-md font-medium text-white">
                LocalStorage ({Object.keys(storageItems).length} items)
              </h3>
              {Object.keys(storageItems).length > 0 ? (
                <div className="mt-1 p-2 bg-gray-800 rounded overflow-auto max-h-40">
                  {Object.entries(storageItems).map(([key, value]) => (
                    <div key={key} className="mb-2">
                      <p className="text-xs font-medium text-blue-400">{key}</p>
                      <p className="text-xs text-gray-400 overflow-hidden text-ellipsis">
                        {value.substring(0, 50)}
                        {value.length > 50 ? "..." : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-400 text-sm">
                  No LocalStorage items found
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <Link href="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Go to Dashboard
            </Button>
          </Link>

          <Link href="/auth/login">
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Go to Login
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="text-white border-gray-600">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
