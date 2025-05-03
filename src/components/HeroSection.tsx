"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
// Helper function for smooth scrolling
const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

// Rotating words component
const RotatingWords = ({
  words,
  isGlitching,
  verb,
}: {
  words: string[];
  isGlitching: boolean;
  verb: "Learn" | "Teach";
}) => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [words]);

  return (
    <span
      className={`${
        verb === "Learn" ? "text-green-300" : "text-blue-300"
      } inline-block relative`}
      style={{ display: "inline-block" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={wordIndex}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={
            isGlitching
              ? {
                  opacity: 1,
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
              : { opacity: 1, y: 0 }
          }
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: isGlitching ? 1.4 : 0.4,
            ease: "easeInOut",
            times: isGlitching
              ? [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
              : undefined,
          }}
        >
          {words[wordIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const CornerText = ({
  position,
  title,
  description,
  delay,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  title: string;
  description: string;
  delay: number;
}) => {
  const positionClasses = {
    "top-left": "top-8 left-8 text-left",
    "top-right": "top-8 right-8 text-right",
    "bottom-left": "bottom-8 left-8 text-left",
    "bottom-right": "bottom-8 right-8 text-right",
  };

  return (
    <motion.div
      className={`absolute z-20 ${positionClasses[position]}`}
      initial={{ opacity: 0, y: position.includes("top") ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.4, 0.0, 0.2, 1],
      }}
    >
      <motion.div
        className="mt-2 text-lg font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.2 }}
      >
        {title}
      </motion.div>
      <motion.div
        className="mt-1 text-sm text-gray-400 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.4 }}
      >
        {description}
      </motion.div>
    </motion.div>
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
    <section className="relative w-full py-32 px-2 bg-gradient-to-b from-gray-900/50 via-black to-gray-900/5">
      <div className="container max-w-screen-xl relative z-10 mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl space-y-3 sm:space-y-4 w-full mx-auto"
          >
            <div className="text-2xl w-full sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight text-center">
              <div className="text-center w-full flex-wrap justify-center whitespace-nowrap">
                <motion.span
                  className={
                    isGlitching
                      ? "relative inline-block text-white"
                      : "text-white"
                  }
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
                <span className="sm:mx-3 mx-2 text-white">through</span>
                <RotatingWords
                  words={rotatingWords}
                  isGlitching={isGlitching}
                  verb={verb}
                />
              </div>
              <div className="text-white">for students and teachers.</div>
            </div>
            <p className="text-sm sm:text-xl md:text-2xl text-gray-400 text-center mx-auto">
              We provide educators with the best tools to teach important math
              concepts.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-row gap-3 sm:gap-4 mx-auto"
          >
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full whitespace-nowrap sm:w-auto lg:min-w-[140px] text-base bg-white text-black hover:bg-gray-200 font-medium"
              >
                Sign In
              </Button>
            </Link>
            <Button
              size="lg"
              className="w-full whitespace-nowrap sm:w-auto lg:min-w-[140px] text-base font-medium bg-gray-950 text-white hover:bg-gray-900"
              onClick={() => scrollTo("details")}
            >
              Learn More
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Placeholder Image Section with Fade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-20 max-w-screen-xl bg-gray-800/50 rounded-2xl border-2 border-gray-700/50 mx-auto mt-24 h-[500px] sm:h-[600px] overflow-hidden"
      >
        <div className="hidden lg:block">
          <CornerText
            position="top-left"
            title="Generate Slide Decks"
            description="Autogenerate beautiful slideshows for any class of students within seconds."
            delay={0.4}
          />
          <CornerText
            position="top-right"
            title="Customize Lesson Plans"
            description="Craft tailored lesson outlines that hit every learning objective in minutes."
            delay={0.6}
          />
          <CornerText
            position="bottom-left"
            title="Auto-Create Practice Worksheets"
            description="Produce endless problem sets with step-by-step solutions to reinforce key concepts."
            delay={0.8}
          />
          <CornerText
            position="bottom-right"
            title="Instant Student Q&A"
            description="Let students ask any math question and get clear, concise explanations on the spot."
            delay={1.0}
          />
        </div>

        {/* Base Image Layer */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("/images/demo_v2.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 1,
          }}
        />

        {/* Multiple Gradient Layers for smooth fade */}
        {/* <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/80" /> */}

        {/* Final dark overlay for better text contrast */}
        {/* <div className="absolute inset-0 bg-black/30" /> */}
      </motion.div>
    </section>
  );
};

export default HeroSection;
