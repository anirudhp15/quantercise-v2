"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Calculator,
  Shield,
} from "lucide-react";

export default function LangGraphAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | "unknown">(
    "unknown"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const checkLangGraphStatus = async () => {
      try {
        const response = await fetch("/api/langgraph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check" }),
        });

        const data = await response.json();

        if (response.ok && data.langGraphEnabled) {
          setStatus("success");
          setMessage(
            data.message || "LangGraph is properly configured and ready to use."
          );
        } else {
          setStatus("error");
          setMessage(data.error || "LangGraph is not configured properly.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          "Failed to check LangGraph status. Check the console for errors."
        );
        console.error("Error checking LangGraph status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLangGraphStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">LangGraph Administration</h1>
          <p className="text-gray-400">
            Manage and monitor your LangGraph configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg border border-gray-800 bg-gray-900"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">LangGraph Status</h2>
              <div className="flex items-center">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                ) : status === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="mt-2 p-4 bg-gray-800 rounded-md">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                <p className="text-gray-300">{message}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  API Status
                </h3>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Checking...</span>
                  </div>
                ) : status === "success" ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  <span className="text-red-500">Offline</span>
                )}
              </div>

              <div className="p-4 bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Primary Model
                </h3>
                <span>gpt-3.5-turbo</span>
              </div>
            </div>
          </motion.div>

          {/* Math Validator Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-lg border border-gray-800 bg-gray-900"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Math Validator</h2>
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="h-5 w-5 text-gray-400" />
                <p className="text-gray-300">
                  Mathematical validation is active and enforcing accuracy
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Validator Model
                  </h3>
                  <span className="text-green-500">gpt-4</span>
                </div>
                <div className="p-4 bg-gray-800 rounded-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Temperature
                  </h3>
                  <span>0 (Maximum Precision)</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Setup Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 rounded-lg border border-gray-800 bg-gray-900"
        >
          <h2 className="text-xl font-semibold mb-4">LangGraph Setup Guide</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              LangGraph is now set up and running in your application with a
              dual-agent architecture:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Primary agent generates initial responses based on user mode
                (student/teacher)
              </li>
              <li>
                <span className="font-semibold text-indigo-400">
                  Math Validator Agent
                </span>{" "}
                reviews all content to ensure mathematical accuracy before
                delivery to users
              </li>
              <li>
                Streaming responses from primary model with asynchronous
                validation
              </li>
              <li>Database persistence for conversations</li>
              <li>Thread management for chat history</li>
              <li>System prompts based on user mode (student/teacher)</li>
            </ul>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">API Requirements</h3>
              <p className="mb-2">
                To use LangGraph with math validation, you need the following
                environment variables:
              </p>
              <div className="bg-gray-800 p-4 rounded-md font-mono text-sm">
                <p>OPENAI_API_KEY=your_openai_api_key</p>
                <p>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
