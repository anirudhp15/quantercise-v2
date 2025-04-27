"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import ParticlesBackground from "@/components/ParticlesBackground";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const redirect = redirectTo || "/dashboard";
  const { signIn, isLoading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard or the original URL
    if (user) {
      console.log(
        "Login page: User already logged in, redirecting to",
        redirect
      );
      router.push(redirect);
    }
  }, [user, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted for:", email);
    console.log("Redirect after login will be to:", redirect);

    await signIn(email, password);

    // Note: The redirection is handled inside signIn method
    // This is intentional redundancy for better UX
    setTimeout(() => {
      if (!error) {
        router.push(redirect);
      }
    }, 500);
  };

  return (
    <>
      <ParticlesBackground>
        <div className="relative flex min-h-screen w-full flex-col justify-between">
          <div className="flex flex-1 items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto w-full max-w-md space-y-8 rounded-2xl border-2 border-gray-700/50 bg-black/40 p-8 backdrop-blur-xl"
            >
              <div className="flex justify-between items-center">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to home
                </button>
              </div>

              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Welcome back
                </h1>
                <p className="text-gray-400">
                  Sign in to continue to Quantercise
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-4">
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
                        className="block w-full rounded-md border-0 bg-gray-800/50 py-2 pl-10 text-white placeholder-gray-400 shadow-sm ring-1 ring-inset ring-gray-700/50 focus:ring-2 focus:ring-white sm:text-sm sm:leading-6 backdrop-blur-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Password
                      </label>
                      <div className="text-sm">
                        <Link
                          href="/auth/reset-password"
                          className="font-medium text-gray-200 hover:text-white"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-md border-0 bg-gray-800/50 py-2 pl-10 text-white placeholder-gray-400 shadow-sm ring-1 ring-inset ring-gray-700/50 focus:ring-2 focus:ring-white sm:text-sm sm:leading-6 backdrop-blur-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-500/20 p-3">
                    <div className="flex">
                      <div className="text-sm text-red-400">{error}</div>
                    </div>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    className="w-full bg-gray-100 hover:bg-white text-gray-900"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link
                      href="/auth/signup"
                      className="font-medium text-gray-200 hover:text-white"
                    >
                      Create one
                    </Link>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
        <Footer />
      </ParticlesBackground>
    </>
  );
}
