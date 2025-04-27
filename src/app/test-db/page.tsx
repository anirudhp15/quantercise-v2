"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type TestResult = {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
};

export default function TestDatabase() {
  const [results, setResults] = useState<TestResult[]>([
    {
      name: "Supabase Connection",
      status: "pending",
      message: "Testing connection...",
    },
    {
      name: "Profiles Table Access",
      status: "pending",
      message: "Testing access to profiles table...",
    },
    {
      name: "Storage Access",
      status: "pending",
      message: "Testing access to storage...",
    },
    {
      name: "User Authentication",
      status: "pending",
      message: "Testing authentication...",
    },
  ]);

  useEffect(() => {
    async function runTests() {
      // Test 1: Supabase Connection
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("count")
          .limit(1);
        if (error) throw error;

        updateTestResult(0, "success", "Connection successful");
      } catch (error: any) {
        console.error("Connection test error:", error);
        updateTestResult(
          0,
          "error",
          `Connection failed: ${error.message || JSON.stringify(error)}`
        );
      }

      // Test 2: Profiles Table Access
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .limit(5);
        if (error) throw error;

        updateTestResult(
          1,
          "success",
          `Successfully accessed profiles table. Found ${data.length} profiles.`
        );
      } catch (error: any) {
        console.error("Profiles table test error:", error);
        updateTestResult(
          1,
          "error",
          `Failed to access profiles table: ${
            error.message || JSON.stringify(error)
          }`
        );
      }

      // Test 3: Storage Access
      try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;

        if (data.length > 0) {
          updateTestResult(
            2,
            "success",
            `Successfully accessed storage. Found ${data.length} buckets: ${data
              .map((b) => b.name)
              .join(", ")}`
          );
        } else {
          updateTestResult(
            2,
            "error",
            "No storage buckets found. Please run the setup SQL script."
          );
        }
      } catch (error: any) {
        console.error("Storage test error:", error);
        updateTestResult(
          2,
          "error",
          `Failed to access storage: ${error.message || JSON.stringify(error)}`
        );
      }

      // Test 4: User Authentication
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        updateTestResult(
          3,
          "success",
          data.session
            ? `Authentication working. User is logged in as ${data.session.user.email}`
            : "Authentication working. No active session."
        );
      } catch (error: any) {
        console.error("Auth test error:", error);
        updateTestResult(
          3,
          "error",
          `Authentication test failed: ${
            error.message || JSON.stringify(error)
          }`
        );
      }
    }

    runTests();
  }, []);

  const updateTestResult = (
    index: number,
    status: "success" | "error",
    message: string
  ) => {
    setResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], status, message };
      return newResults;
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="w-full max-w-2xl rounded-lg border border-gray-800 bg-gray-900/50 p-8 backdrop-blur-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Database Connection Tests
        </h1>

        <div className="mb-8 space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`rounded-md p-4 ${
                result.status === "pending"
                  ? "bg-gray-700/50"
                  : result.status === "success"
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  result.status === "pending"
                    ? "text-gray-300"
                    : result.status === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {result.name}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  result.status === "pending"
                    ? "text-gray-400"
                    : result.status === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {result.message}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center space-x-4">
          <Link href="/test-auth">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Go to Auth Test
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
