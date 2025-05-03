"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Clock,
  Search,
  Trash2,
  MoreVertical,
  MessageSquare,
  Cog,
  Plus,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { createClient } from "@supabase/supabase-js";
import { useClerkSupabase } from "@/lib/hooks/use-clerk-supabase";
import * as Tooltip from "@radix-ui/react-tooltip";
import { HighlightedInput } from "@/components/ui/highlighted-input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Database } from "@/../types/supabase";

// Define Thread type based on schema
type Thread = Database["public"]["Tables"]["threads"]["Row"]; // Restored type definition
// type Thread = any; // Using any temporarily to bypass type error

// Create Supabase client for database operations only (not auth)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const ChatsPage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useClerkSupabase();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");

  // Fetch all threads
  useEffect(() => {
    async function fetchThreads() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("threads")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setThreads(data || []);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchThreads();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  // Get theme-based classes for thread cards
  const getThemeClasses = (threadMode: string) => {
    if (threadMode === "teacher") {
      return "border-blue-800/30 hover:border-blue-700/50 bg-blue-900/10 hover:bg-blue-900/20";
    }
    return "border-green-800/30 hover:border-green-700/50 bg-green-900/10 hover:bg-green-900/20";
  };

  // Handle deleting a thread
  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this thread?")) {
      return;
    }

    try {
      // Optimistic UI update
      setThreads((prev) => prev.filter((th) => th.id !== id));

      // Delete from database
      const { error } = await supabase.from("threads").delete().eq("id", id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      // Revert the optimistic update if the deletion fails
      const { data } = await supabase
        .from("threads")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setThreads((prev) => [...prev, data]);
      }
    }
  };

  return (
    <div className="h-screen bg-gray-950/75">
      <div className="w-full bg-gradient-to-b  from-gray-900 to-gray-900/5">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-2 text-center mb-8"
          >
            <p className="text-sm uppercase tracking-wider text-gray-400">
              Welcome back {user?.firstName ? `, ${user.firstName}` : ""}
            </p>
            <h1 className="text-4xl font-bold text-white">
              Select a lesson or create a new one
            </h1>
          </motion.div>

          {/* Quick Launch Bar */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="relative rounded-lg border-2 border-gray-700/50 bg-gray-800/50 shadow-lg">
              <HighlightedInput
                value={input}
                onChange={(value) => setInput(value)}
                placeholder="Start a new lesson..."
                className="w-full pl-4 pr-24 py-3 h-12 border-none focus:outline-none transition-all duration-200"
              />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                <Tooltip.Provider>
                  <Tooltip.Root delayDuration={200}>
                    <Tooltip.Trigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                        <Plus className="h-4 w-4 text-gray-400" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md"
                        sideOffset={5}
                      >
                        New Chat
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  <Tooltip.Root delayDuration={200}>
                    <Tooltip.Trigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                        <Cog className="h-4 w-4 text-gray-400" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md"
                        sideOffset={5}
                      >
                        Settings
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-xl max-w-7xl mx-auto border border-gray-800/50">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            No threads yet
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start a new chat to begin learning or planning your next lesson
          </p>
        </div>
      ) : (
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search threads..."
                className="pl-10 pr-4 py-2 w-full text-sm lg:text-base bg-gray-900/80 border-2 border-gray-800 rounded-lg text-gray-400 focus:text-white focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
            {threads.map((thread) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "cursor-pointer border rounded-lg p-4 transition-all duration-200 relative group",
                  getThemeClasses(thread.mode)
                )}
                onClick={() =>
                  router.push(
                    `/dashboard/chats/new?id=${thread.id}&mode=${thread.mode}`
                  )
                }
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className="p-1.5 rounded-full hover:bg-gray-700/50 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center mb-2">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full mr-2",
                      thread.mode === "teacher" ? "bg-blue-400" : "bg-green-400"
                    )}
                  />
                  <span className="text-xs text-gray-400">
                    {thread.mode === "teacher" ? "Teacher" : "Student"} Mode
                  </span>
                </div>

                <h3 className="text-lg font-medium text-white mb-1 truncate pr-6">
                  {thread.title || "Untitled Thread"}
                </h3>

                <div className="h-10 mb-3"></div>

                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {formatDate(thread.updated_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
