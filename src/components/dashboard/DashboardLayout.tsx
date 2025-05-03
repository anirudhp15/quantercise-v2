"use client";

import React, { useState } from "react";
import {
  Menu,
  ArrowLeftToLine,
  ArrowRightToLine,
  Boxes,
  Plus,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  GraduationCap,
  School,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/dashboard/Sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";

// Inner layout component to access context
const DashboardLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useDashboard();
  const router = useRouter();
  const { theme } = useTheme();

  // Navigation items for the collapsed sidebar
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

  const startNewChat = async () => {
    router.push(`/dashboard/chats/new?mode=${theme}`);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Desktop sidebar */}
      <motion.div
        className="hidden fixed h-full lg:block z-40"
        initial={{ x: "-100%" }}
        animate={{
          x: 0,
          width: isCollapsed ? "0px" : "256px",
          overflow: "hidden",
          transition: {
            x: { duration: 0.5, ease: "easeInOut", delay: 0.5 },
            width: { duration: 0.05, ease: "easeInOut" },
          },
        }}
      >
        <Sidebar
          isMobileSidebarOpen={false}
          setMobileSidebarOpen={() => {}}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      </motion.div>

      {/* Floating icons when collapsed */}
      {isCollapsed && (
        <motion.div
          className="hidden lg:flex fixed left-0 h-full w-16 z-40 flex-col py-4 items-center"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        >
          <div className="flex flex-col items-center gap-4 w-full">
            <Link
              href="/"
              className={`p-3 text-gray-300 hover:text-white ${
                theme === "student" ? "bg-green-600" : "bg-blue-600"
              } rounded-md`}
            >
              <Boxes className="h-4 w-4" />
              {/* Collapse toggle button */}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white hover:bg-gray-800/50"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ArrowRightToLine className="h-4 w-4" />
              ) : (
                <ArrowLeftToLine className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700/80 shadow-md "
              onClick={startNewChat}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <div className=" flex flex-col items-center gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="p-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-md"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile sidebar trigger */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-[60] text-gray-300 hover:text-white bg-transparent hover:bg-[#202123]/60"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-none bg-[#202123]">
          <Sidebar
            isMobileSidebarOpen={isMobileOpen}
            setMobileSidebarOpen={setIsMobileOpen}
            isCollapsed={false}
            setIsCollapsed={() => {}}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <motion.main
        className="flex-1 h-screen overflow-y-auto"
        initial={false}
        animate={{
          paddingLeft: isCollapsed ? "0px" : "256px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          className="h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
};

// Export the main layout component wrapped in the provider
export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
};
