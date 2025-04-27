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

  // Transform the container max-width based on scroll - now shrinks instead of grows
  const containerMaxWidth = useTransform(scrollY, [0, 100], ["100%", "60%"]);
  const containerPadding = useTransform(scrollY, [0, 100], ["8rem", "2rem"]);
  const containerMargin = useTransform(scrollY, [0, 100], ["0px", "1rem"]);
  const containerRadius = useTransform(scrollY, [0, 100], ["0px", "9999px"]);

  const navItems: NavItem[] = [
    { name: "Info", action: () => scrollTo("details") },
    { name: "Pricing", action: () => scrollTo("pricing") },
    { name: "Our Mission", href: "/goal" },
    { name: "Hit Us Up", action: () => scrollTo("footer") },
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
        className="transition-all duration-200 ease-in-out border border-gray-800/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Boxes className="h-6 w-6 text-primary" />
              <span className="font-bold tracking-tighter text-primary text-xl">
                Quantercise
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(navigationMenuTriggerStyle())}
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
                          "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
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

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-full">
                Login
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="default" size="sm" className="rounded-full">
                Try for Free
              </Button>
            </Link>
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary"
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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      />

      {/* Mobile menu panel */}
      <motion.div
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-background border-l border-border z-50 md:hidden"
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <span className="font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
                transition={{ duration: 0.2 }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block py-2 text-lg font-medium hover:text-primary transition-colors"
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
                    className="block w-full text-left py-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    {item.name}
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full rounded-full">
                Login
              </Button>
            </Link>
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>
              <Button className="w-full rounded-full">Try for Free</Button>
            </Link>
          </div>
        </nav>
      </motion.div>
    </header>
  );
};

export default Navbar;
