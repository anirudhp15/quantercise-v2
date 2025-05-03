"use client";

import { UserProfile } from "@clerk/nextjs";
import { useClerkSupabase } from "@/lib/hooks/use-clerk-supabase";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Loader2,
  GraduationCap,
  School,
  Send,
  Settings,
  Plus,
  User,
  Cog,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/../types/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { HighlightedInput } from "@/components/ui/highlighted-input";
import { useTheme } from "@/lib/theme-context";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useRouter } from "next/navigation";
type Thread = Database["public"]["Tables"]["threads"]["Row"];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

export default function DashboardPage() {
  const { user, profile, isLoaded } = useClerkSupabase();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [input, setInput] = useState("");
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    async function fetchThreads() {
      try {
        setIsLoadingThreads(true);
        const response = await fetch("/api/threads");
        if (!response.ok) {
          throw new Error("Failed to fetch threads");
        }
        const data = await response.json();
        // Get the 5 most recent threads
        setThreads(data.threads?.slice(0, 5) || []);
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setIsLoadingThreads(false);
      }
    }

    fetchThreads();
  }, []);

  const startNewChat = async () => {
    router.push(`/dashboard/chats/new?mode=${theme}`);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950/75 text-white">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-b from-gray-900 to-gray-900/5">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-2 text-center mb-8"
          >
            <p className="text-sm uppercase tracking-wider text-gray-400">
              Hello{user?.firstName ? `, ${user.firstName}` : ""}
            </p>
            <h1 className="text-4xl font-bold text-white">
              Welcome to Quantercise
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
                      <button
                        onClick={startNewChat}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                      >
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

      <div className="container mx-auto max-w-7xl py-12">
        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/dashboard/chats",
              title: "Chats",
              icon: <MessageSquare className="h-5 w-5" />,
              description: "Start a lesson with our AI assistant",
            },
            {
              href: "/dashboard/profile",
              title: "Profile",
              icon: <User className="h-5 w-5" />,
              description: "View and update your profile information",
            },
            {
              href: "/dashboard/settings",
              title: "Settings",
              icon: <Settings className="h-5 w-5" />,
              description: "Configure your account settings",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={card.href}
                className="flex flex-col items-start p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="rounded-full bg-gray-800 p-3 mb-4">
                  {card.icon}
                </div>
                <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                <p className="text-gray-400 text-sm">{card.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* User Information
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 rounded-xl border border-gray-800 bg-gray-800/50 p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">User Information</h2>
            <Tooltip.Provider>
              <Tooltip.Root delayDuration={200}>
                <Tooltip.Trigger asChild>
                  <Info className="h-4 w-4 text-gray-400" />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md"
                    sideOffset={5}
                  >
                    Your account details
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-400">Email:</span>{" "}
              {user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-sm">
              <span className="text-gray-400">Name:</span> {user?.fullName}
            </p>
            {profile && (
              <p className="text-sm">
                <span className="text-gray-400">Created:</span>{" "}
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </motion.div> */}

        {/* Recent Threads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Your Recent Threads</h2>
              <Tooltip.Provider>
                <Tooltip.Root delayDuration={200}>
                  <Tooltip.Trigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md"
                      sideOffset={5}
                    >
                      Your latest chat history
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <Link
              href="/dashboard/chats"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-400">No recent threads</p>
                <Link
                  href="/dashboard/chats/new"
                  className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Start a new chat
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/dashboard/chats/new?id=${thread.id}&mode=${thread.mode}`}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-800/50 hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex-shrink-0">
                      {thread.mode === "student" ? (
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-purple-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <School className="h-4 w-4 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {thread.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(thread.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
