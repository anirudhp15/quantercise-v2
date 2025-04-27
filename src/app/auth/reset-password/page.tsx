"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage("Check your email for the password reset link");
    } catch (error: any) {
      setError(error?.message || "An error occurred. Please try again.");
      console.error("Error resetting password:", error);
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
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to login
          </button>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Reset your password
          </h1>
          <p className="text-gray-400">
            We'll send you an email with a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email address
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-10 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 sm:text-sm sm:leading-6"
                placeholder="you@example.com"
              />
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
              {isLoading ? "Sending link..." : "Send reset link"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
