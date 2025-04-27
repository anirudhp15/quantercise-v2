"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/dashboard/Sidebar";

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!isLoading && !user) {
      console.log("Dashboard: No user found, redirecting to login");
      router.push("/auth/login?redirect=/dashboard");
    } else if (!isLoading && user) {
      console.log("Dashboard: User authenticated:", user.email);
      console.log("Dashboard: Session exists:", !!session);
    }
  }, [user, isLoading, router, session]);

  // If still loading or no user, show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#343541] text-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, show error state
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#343541] text-white">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg text-red-400">Authentication required</p>
          <Button
            onClick={() => router.push("/auth/login?redirect=/dashboard")}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#343541]">
      {/* Desktop sidebar */}
      <motion.div
        className="hidden fixed h-full lg:block z-50"
        initial={false}
        animate={{
          width: isCollapsed ? "64px" : "256px",
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
      >
        <Sidebar
          isMobileSidebarOpen={false}
          setMobileSidebarOpen={() => {}}
          isCollapsed={isCollapsed}
        />

        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-16 top-4 z-50 rounded-full bg-[#202123] border border-gray-700 text-gray-300 hover:text-white hover:bg-[#202123]"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </motion.div>

      {/* Mobile sidebar trigger */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-40 text-gray-300 hover:text-white bg-transparent hover:bg-[#202123]/60"
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
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <motion.main
        className="flex-1 h-screen overflow-y-auto"
        initial={false}
        animate={{
          paddingLeft: isCollapsed ? "64px" : "256px",
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
