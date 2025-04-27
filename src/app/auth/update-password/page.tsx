"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated through the recovery flow
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // No user, redirect to login
        router.push("/auth/login");
      }
    };

    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setMessage("Password updated successfully");

      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      setError(error?.message || "An error occurred. Please try again.");
      console.error("Error updating password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-md space-y-8 rounded-2xl border border-gray-800 bg-gray-950/70 p-8 backdrop-blur"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Update your password
          </h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                New Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-10 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-10 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 8 characters
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/20 p-3">
              <div className="flex">
                <div className="text-sm text-red-400">{error}</div>
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-500/20 p-3">
              <div className="flex">
                <div className="text-sm text-green-400">{message}</div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500"
              disabled={isLoading}
            >
              {isLoading ? "Updating password..." : "Update password"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
