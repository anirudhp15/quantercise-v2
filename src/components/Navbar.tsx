"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, Boxes } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton, SignInButton } from "@clerk/nextjs";
import { useClerkSupabase } from "@/lib/hooks/use-clerk-supabase";

// Helper function for smooth scrolling
const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  element?.scrollIntoView!({ behavior: "smooth" });
};

type NavItem = {
  name: string;
  action?: () => void;
  href?: string;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const { isSignedIn, isLoaded } = useClerkSupabase();

  // Transform the container max-width based on scroll - now shrinks instead of grows
  const containerMaxWidth = useTransform(scrollY, [0, 100], ["100%", "70%"]);
  const containerPadding = useTransform(scrollY, [0, 100], ["8rem", "2rem"]);
  const containerMargin = useTransform(scrollY, [0, 100], ["0px", "1rem"]);
  const containerRadius = useTransform(scrollY, [0, 100], ["0px", "9999px"]);

  const navItems: NavItem[] = [
    { name: "Info", action: () => scrollTo("details") },
    { name: "Pricing", action: () => scrollTo("pricing") },
    { name: "Our Mission", href: "/goal" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <motion.div
        style={{
          maxWidth: containerMaxWidth,
          paddingLeft: containerPadding,
          paddingRight: containerPadding,
          marginTop: containerMargin,
          marginLeft: "auto",
          marginRight: "auto",
          borderRadius: containerRadius,
        }}
        className="transition-all duration-200 ease-in-out border-y border-gray-800 bg-black/80 backdrop-blur-lg supports-[backdrop-filter]:bg-black/60"
      >
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Boxes className="h-6 w-6 text-white" />
              <span className="font-bold tracking-tighter text-white text-xl">
                Quantercise
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                        )}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.action) {
                            item.action();
                          }
                        }}
                        className={cn(
                          "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-gray-300 hover:text-white hover:bg-white/10 focus:bg-white/10 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                        )}
                      >
                        {item.name}
                      </button>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="hidden lg:flex text-sm items-center space-x-3">
            {isLoaded ? (
              isSignedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      size="sm"
                      className=" rounded-full  bg-white text-black hover:bg-gray-200 font-medium"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button
                      size="sm"
                      className=" rounded-full bg-gray-950 text-white hover:bg-gray-900"
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                  <Link href="/sign-up">
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full bg-white text-black hover:bg-gray-200"
                    >
                      Try for Free
                    </Button>
                  </Link>
                </>
              )
            ) : (
              <div className="h-9 w-[120px] animate-pulse rounded-md bg-gray-800"></div>
            )}
          </div>

          {/* Mobile navigation */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile menu overlay */}
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      />

      {/* Mobile menu panel */}
      <motion.div
        className="fixed inset-0 w-screen h-full bg-black border-l border-gray-800 z-50 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 150 }}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-800">
          <span className="font-semibold text-white">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 flex flex-col justify-between h-[calc(100%-3.5rem)]">
          <div className="flex flex-col space-y-5 pt-4">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block py-3 text-xl font-medium text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      }
                      setIsOpen(false);
                    }}
                    className="block w-full text-left py-3 text-xl font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-auto pb-8 text-sm">
            {isLoaded ? (
              isSignedIn ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    <Button
                      variant="default"
                      className="w-full rounded-full text-black"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                  <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                    <Button className="w-full mt-3 rounded-full bg-white text-black hover:bg-gray-200">
                      Try for Free
                    </Button>
                  </Link>
                </>
              )
            ) : (
              <div className="h-9 w-full animate-pulse rounded-md bg-gray-800"></div>
            )}
          </div>
        </nav>
      </motion.div>
    </header>
  );
};

export default Navbar;
