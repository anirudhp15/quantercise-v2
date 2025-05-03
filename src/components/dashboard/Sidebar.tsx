"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  X,
  MessageSquare,
  GraduationCap,
  School,
  Boxes,
  Plus,
  Trash2,
  ArrowLeftToLine,
  ArrowRightToLine,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/../types/supabase";

type SidebarProps = {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

type Thread = Database["public"]["Tables"]["threads"]["Row"];

// Animation variants
const sidebarItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
  hover: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transition: { duration: 0.2 },
  },
};

const textVariants = {
  expanded: { opacity: 1, x: 0 },
  collapsed: { opacity: 0, x: -10 },
};

const Sidebar = ({
  isMobileSidebarOpen,
  setMobileSidebarOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isNewChatHovered, setIsNewChatHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient<Database>();

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching threads...");

      // Use the API endpoint instead of direct Supabase query
      const response = await fetch("/api/threads");
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (data.threads) {
        console.log(`Found ${data.threads.length} threads`);

        // If in development mode and no threads returned, use sample data
        if (
          process.env.NODE_ENV === "development" &&
          data.threads.length === 0
        ) {
          console.log("Using hardcoded sample threads for development");

          // Create some sample threads for development
          const sampleThreads = [
            {
              id: "sample-1",
              title: "Learning point-slope form",
              mode: "student",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "anonymous",
              clerk_id: "dev-sample",
              preview_content: null,
              preview_metadata: null,
            },
            {
              id: "sample-2",
              title: "Teacher mode: Worksheet for calculus",
              mode: "teacher",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: "anonymous",
              clerk_id: "dev-sample",
              preview_content: null,
              preview_metadata: null,
            },
          ];

          setThreads([]);
        } else {
          setThreads(data.threads);
        }
      } else {
        console.warn("No threads property in the response:", data);
        setThreads([]);
      }
    } catch (error) {
      console.error("Error fetching threads:", error);

      // In development, if there's an error, use sample data
      if (process.env.NODE_ENV === "development") {
        console.log("Using hardcoded sample threads due to error");
        const fallbackThreads = [
          {
            id: "fallback-1",
            title: "Error fallback: Algebra basics",
            mode: "student",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: "anonymous",
            clerk_id: "error-fallback",
            preview_content: null,
            preview_metadata: null,
          },
        ];
        setThreads(fallbackThreads);
      } else {
        toast({
          title: "Error",
          description: "Failed to load recent threads",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();

    // Set up real-time subscription for threads
    const channel = supabase
      .channel("threads_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
        },
        (payload) => {
          console.log("Received real-time thread update:", payload);
          fetchThreads();
        }
      )
      .subscribe();

    console.log("Set up real-time subscription for threads");

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      name: "Chats",
      href: "/dashboard/chats",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const startNewChat = async (mode: "student" | "teacher") => {
    try {
      setIsCreatingChat(true);
      setTheme(mode);

      // Navigate to the new chat page
      router.push(`/dashboard/chats/new?mode=${mode}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to navigate to new chat",
        variant: "destructive",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const deleteThread = async (id: string) => {
    try {
      // Optimistic UI update - remove thread from list
      setThreads((prev) => prev.filter((thread) => thread.id !== id));

      const response = await fetch(`/api/threads?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert the UI if the API call fails
        toast({
          title: "Error",
          description: "Failed to delete thread",
          variant: "destructive",
        });

        // Refresh the list to restore the UI
        await fetchThreads();
      } else {
        toast({
          title: "Success",
          description: "Thread deleted",
        });
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast({
        title: "Error",
        description: "Failed to delete thread",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-gray-800/50 border-2 border-gray-700/50 text-white transition-all duration-200 ease-in-out lg:static lg:translate-x-0 h-full overflow-hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-0" : "w-64"
        )}
      >
        {/* Mobile close button */}
        {!isCollapsed && (
          <div className="absolute right-2 top-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        )}

        <div
          className={cn(
            "flex items-center p-4",
            isCollapsed ? "justify-center" : "gap-2"
          )}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <Link href="/">
                  <Boxes className="h-4 w-4" />
                </Link>
              )}
              {!isCollapsed && (
                <Link href="/dashboard">
                  <span className="text-lg font-bold text-primary tracking-tight">
                    Quantercise
                  </span>
                </Link>
              )}
            </div>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/80 shadow-md transition-all duration-300"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ArrowRightToLine className="h-4 w-4" />
                ) : (
                  <ArrowLeftToLine className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-2">
          <motion.button
            className={cn(
              "flex items-center gap-3 rounded-md border border-gray-700 text-sm font-medium text-white transition-colors duration-200",
              isCollapsed ? "justify-center px-2 py-3" : "w-full px-3 py-3"
            )}
            onClick={() => startNewChat(theme)}
            disabled={isCreatingChat}
            onMouseEnter={() => setIsNewChatHovered(true)}
            onMouseLeave={() => setIsNewChatHovered(false)}
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            style={{
              background: isNewChatHovered
                ? "rgba(255, 255, 255, 0.1)"
                : "transparent",
            }}
          >
            {isCreatingChat ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-white" />
                {!isCollapsed && <span>Creating...</span>}
              </>
            ) : (
              <div className="flex items-center gap-2 px-1">
                <Plus className="h-4 w-4" />
                {!isCollapsed && <span>New chat</span>}
              </div>
            )}
          </motion.button>
        </div>

        {/* Mode Selector */}
        {!isCollapsed && (
          <div className="px-2 pt-2 pb-4">
            <div className="rounded-lg bg-gray-800/50 p-2 flex gap-2">
              <motion.button
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                  theme === "student"
                    ? "bg-green-500 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700/80"
                )}
                onClick={() => setTheme("student")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Learn</span>
              </motion.button>
              <motion.button
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                  theme === "teacher"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700/80"
                )}
                onClick={() => setTheme("teacher")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <School className="h-4 w-4" />
                <span>Teach</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Threads List */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            <div className="mt-2 px-3">
              <div className="group flex items-center rounded-md gap-3">
                <Search className="h-4 w-4 text-gray-400 ml-3" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  className="h-9 w-full bg-gray-800/40 border-none rounded-md px-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 px-3 pb-20 pt-3">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center pt-4"
                >
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-white" />
                </motion.div>
              ) : threads.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-2 px-2 pt-8 text-center"
                >
                  <p className="text-sm text-gray-400">
                    No recent chats found.
                  </p>
                  <p className="text-xs text-gray-500">
                    Click "New chat" above to start a conversation.
                  </p>
                </motion.div>
              ) : (
                threads.map((thread) => {
                  const isActive =
                    pathname === "/dashboard/chats/new" &&
                    searchParams.get("id") === thread.id;
                  return (
                    <motion.div
                      key={thread.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors duration-50",
                        isActive ? "bg-[#343541] text-white" : "text-gray-300"
                      )}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      onMouseEnter={() => setHoveredIndex(Number(thread.id))}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div
                        className="flex flex-1 items-center gap-3 overflow-hidden"
                        onClick={() =>
                          router.push(
                            `/dashboard/chats/new?id=${thread.id}&mode=${thread.mode}`
                          )
                        }
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{thread.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={cn("px-2 py-2", isCollapsed && "flex-1")}>
          {!isCollapsed && (
            <h3 className="px-3 pb-1 text-xs font-medium text-gray-400">
              Main
            </h3>
          )}
          <div className="space-y-1">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                variants={sidebarItemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md text-sm transition-colors duration-200",
                    isCollapsed
                      ? "justify-center px-2 py-3"
                      : "gap-3 px-3 py-2",
                    pathname === item.href
                      ? "bg-[#343541] text-white"
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <motion.span
                      variants={textVariants}
                      initial="expanded"
                      animate={isCollapsed ? "collapsed" : "expanded"}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-gray-700 px-2 py-2">
            <motion.div
              variants={sidebarItemVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors duration-200 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            </motion.div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
