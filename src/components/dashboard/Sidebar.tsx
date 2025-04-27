"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  X,
  MessageSquare,
  GraduationCap,
  School,
  Boxes,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { toast } from "@/components/ui/use-toast";

type SidebarProps = {
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
};

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
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isNewChatHovered, setIsNewChatHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      name: "Exercises",
      href: "/dashboard/exercises",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      name: "Progress",
      href: "/dashboard/progress",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
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

      // Create a new conversation in the database with the selected mode
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          title: `New ${mode} conversation`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Use router.push instead of window.location for client-side navigation
          router.push("/auth/login");
          return;
        }
        throw new Error(errorData.error || "Failed to create conversation");
      }

      const data = await response.json();

      // Navigate to the chat page with the new conversation ID and mode
      router.push(`/dashboard/chat?id=${data.id}&mode=${mode}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create conversation",
        variant: "destructive",
      });
    } finally {
      setIsCreatingChat(false);
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
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#202123] text-white transition-all duration-200 ease-in-out lg:static lg:translate-x-0 h-full overflow-hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
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
            "flex items-center p-3 pb-0",
            isCollapsed ? "justify-center" : "gap-2"
          )}
        >
          <Boxes className="h-4 w-4" />
          {!isCollapsed && (
            <span className="text-lg font-bold text-primary tracking-tight">
              Quantercise
            </span>
          )}
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
              <div className="flex items-center gap-2 px-2">
                <Plus className="h-4 w-4" />
                {!isCollapsed && <span>New chat</span>}
              </div>
            )}
          </motion.button>
        </div>

        {/* Mode Selector */}
        {!isCollapsed && (
          <div className="px-2 pt-2 pb-4">
            <div className="rounded-lg bg-[#2d2d30] p-1 flex">
              <motion.button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200",
                  theme === "student"
                    ? "bg-[#343541] text-white"
                    : "text-gray-500"
                )}
                onClick={() => setTheme("student")}
                whileHover={
                  theme !== "student"
                    ? { backgroundColor: "rgba(255, 255, 255, 0.05)" }
                    : {}
                }
                whileTap={{ scale: 0.98 }}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Student</span>
              </motion.button>
              <motion.button
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200",
                  theme === "teacher"
                    ? "bg-[#343541] text-white"
                    : "text-gray-500"
                )}
                onClick={() => setTheme("teacher")}
                whileHover={
                  theme !== "teacher"
                    ? { backgroundColor: "rgba(255, 255, 255, 0.05)" }
                    : {}
                }
                whileTap={{ scale: 0.98 }}
              >
                <School className="h-3.5 w-3.5" />
                <span>Teacher</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Conversations List */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-2">
              <h3 className="px-3 pb-1 text-xs font-medium text-gray-400">
                Recent chats
              </h3>
              <div className="space-y-1">
                <AnimatePresence>
                  {[
                    "Calculus Help",
                    "Linear Algebra",
                    "Statistics Concepts",
                  ].map((title, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors duration-200",
                        pathname === `/dashboard/chat?id=${index}`
                          ? "bg-[#343541] text-white"
                          : "text-gray-300"
                      )}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() =>
                        router.push(`/dashboard/chat?id=${index}&mode=${theme}`)
                      }
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{title}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div
          className={cn(
            "border-t border-gray-700 px-2 py-2",
            isCollapsed && "flex-1"
          )}
        >
          <div className="space-y-1">
            {navItems.map((item, index) => (
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
