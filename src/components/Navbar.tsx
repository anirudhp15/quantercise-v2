"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Helper function for smooth scrolling
const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  // Transform the container max-width based on scroll
  const containerMaxWidth = useTransform(scrollY, [0, 100], ["1280px", "100%"]);

  const containerPadding = useTransform(scrollY, [0, 100], ["16rem", "1rem"]);

  const navItems = [
    { name: "Info", action: () => scrollTo("details") },
    { name: "Pricing", action: () => scrollTo("pricing") },
    { name: "Our Mission", href: "/goal" },
    { name: "Hit Us Up", action: () => scrollTo("footer") },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-800/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <motion.div
        style={{
          maxWidth: containerMaxWidth,
          paddingLeft: containerPadding,
          paddingRight: containerPadding,
        }}
        className="mx-auto transition-all duration-200 ease-in-out"
      >
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-primary text-xl">
                Quantercise
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
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
                        onClick={item.action}
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

            <Link href="/dashboard">
              <Button variant="default" size="sm">
                Try for Free
              </Button>
            </Link>
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-[425px]">
                <div className="flex flex-col space-y-4 pt-6">
                  {navItems.map((item) => (
                    <DialogClose key={item.name} asChild>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-lg py-2 font-medium transition-colors hover:text-primary"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <button
                          onClick={item.action}
                          className="text-left text-lg py-2 font-medium transition-colors hover:text-primary"
                        >
                          {item.name}
                        </button>
                      )}
                    </DialogClose>
                  ))}
                  <Link href="/dashboard" className="mt-4">
                    <Button className="w-full">Try for Free</Button>
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default Navbar;
