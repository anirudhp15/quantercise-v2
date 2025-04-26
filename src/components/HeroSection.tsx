"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Helper function for smooth scrolling
const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const HeroSection = () => {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
      {/* Background pattern - subtle grid */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] opacity-20" />

      <div className="container max-w-screen-xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl space-y-4"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary tracking-tight">
              Math, but Make It Next-Level.
            </h1>
            <p className="text-xl md:text-2xl text-foreground">
              Empowering students to tackle calculus way before high
              school—because the future is all about thinking sharp, thinking
              smart.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mt-6"
          >
            <Link href="/dashboard">
              <Button size="lg" className="min-w-[140px] text-base font-medium">
                Try for Free
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              className="min-w-[140px] text-base font-medium"
              onClick={() => scrollTo("details")}
            >
              See What&apos;s Up
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Abstract decorative shapes - subtle visual interest */}
      <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
    </section>
  );
};

export default HeroSection;
