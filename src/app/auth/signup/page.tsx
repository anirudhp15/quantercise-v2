"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, User, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { signUp, isLoading, error } = useAuth();
  const router = useRouter();

  const testConnection = async () => {
    try {
      setDebugInfo("Testing connection...");
      // Test if we can reach Supabase
      const { data, error } = await supabase.from("profiles").select("count");

      if (error) {
        setDebugInfo(`Connection error: ${error.message}`);
        return;
      }

      setDebugInfo("Connection successful. Database is accessible.");
    } catch (error: any) {
      setDebugInfo(
        `Connection test failed: ${error.message || JSON.stringify(error)}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (password.length < 6) {
      setDebugInfo("Password must be at least 6 characters long");
      return;
    }

    await signUp(email, password, fullName);
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
            onClick={() => router.push("/")}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </button>

          <button
            onClick={testConnection}
            className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Test Connection
          </button>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-gray-400">Sign up to start using Quantercise</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Full Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-md border-0 bg-gray-800 py-2 pl-10 text-white placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-green-500 sm:text-sm sm:leading-6"
                  placeholder="John Doe"
                />
              </div>
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
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
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 6 characters
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/20 p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div className="text-sm text-red-400">{error}</div>
              </div>
            </div>
          )}

          {debugInfo && (
            <div className="rounded-md bg-blue-500/20 p-3">
              <div className="flex">
                <div className="text-sm text-blue-400">{debugInfo}</div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-green-500 hover:text-green-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
