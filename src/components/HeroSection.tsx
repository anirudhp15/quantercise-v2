"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// Helper function for smooth scrolling
const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

// Rotating words component
const RotatingWords = ({ words }: { words: string[] }) => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [words]);

  return (
    <span
      className="text-green-300 inline-block relative"
      style={{ minWidth: "240px", display: "inline-block" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={wordIndex}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
        >
          {words[wordIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const HeroSection = () => {
  const rotatingWords = [
    "diagrams,  ",
    "graphs,",
    "theorems,",
    "proofs,",
    "visuals,",
    "slides,",
    "lessons,",
    "projects",
    "concepts",
    "challenges",
    "examples,",
    "quizzes,",
    "workbooks,",
    "lectures,",
    "problems,",
  ];

  const [verb, setVerb] = useState<"Learn" | "Teach">("Learn");
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    // Function to handle the glitch effect and verb toggling
    const toggleWithGlitch = () => {
      setIsGlitching(true);

      setTimeout(() => {
        setIsGlitching(false);
        setVerb((prev) => (prev === "Learn" ? "Teach" : "Learn"));
      }, 1400);
    };

    // Initial toggle after 5 seconds
    const initialTimer = setTimeout(toggleWithGlitch, 5000);

    // Set up recurring toggle every 5 seconds
    const interval = setInterval(toggleWithGlitch, 6400); // 5000ms wait + 1400ms glitch

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative w-full py-32 px-4 ">
      {/* Background pattern - subtle grid */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] opacity-20" />

      <div className="container max-w-screen-xl relative z-10 mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl space-y-3 sm:space-y-4 w-full mx-auto"
          >
            <div className="text-3xl w-full sm:text-4xl md:text-6xl lg:text-7xl font-bold text-primary tracking-tight leading-tight text-center">
              <div className="inline-flex text-left w-full flex-wrap justify-center whitespace-nowrap">
                <motion.span
                  className={isGlitching ? "relative inline-block" : ""}
                  animate={
                    isGlitching
                      ? {
                          x: [0, -4, 6, -2, 8, -5, 3, -7, 4, -2, 0],
                          y: [0, 2, -3, 1, -2, 4, -1, 3, -2, 0],
                          filter: [
                            "none",
                            "drop-shadow(4px 0 0 rgba(255,0,0,0.7)) drop-shadow(-4px 0 0 rgba(0,255,255,0.7))",
                            "drop-shadow(-3px 0 0 rgba(255,0,0,0.7)) drop-shadow(3px 0 0 rgba(0,255,255,0.7))",
                            "drop-shadow(5px 0 0 rgba(255,0,0,0.7)) drop-shadow(-5px 0 0 rgba(0,255,255,0.7))",
                            "drop-shadow(-6px 0 0 rgba(255,0,0,0.7)) drop-shadow(6px 0 0 rgba(0,255,255,0.7))",
                            "drop-shadow(4px 0 0 rgba(255,0,0,0.7)) drop-shadow(-4px 0 0 rgba(0,255,255,0.7))",
                            "drop-shadow(-2px 0 0 rgba(255,0,0,0.7)) drop-shadow(2px 0 0 rgba(0,255,255,0.7))",
                            "none",
                          ],
                          scale: [1, 1.05, 0.98, 1.03, 0.97, 1.02, 1],
                          rotate: [0, 0.5, -1, 0.7, -0.5, 0.3, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.4,
                    ease: "easeInOut",
                    times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                  }}
                >
                  {verb}
                </motion.span>
                <span className="mx-3">through</span>
                <RotatingWords words={rotatingWords} />
              </div>
              <div>for students and teachers.</div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-foreground text-center mx-auto">
              We provide students with the right tools to understand higher math
              before high school
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mx-auto"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[140px] text-base hover:bg-gray-300 font-medium"
              >
                Try for Free
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto min-w-[140px] bg-gray-950 hover:bg-gray-900 text-base font-medium"
              onClick={() => scrollTo("details")}
            >
              See What&apos;s Up
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Abstract decorative shapes - subtle visual interest */}
      <div className="absolute -bottom-48 -left-48 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -top-48 -right-48 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-primary/5 blur-3xl" />
    </section>
  );
};

export default HeroSection;
