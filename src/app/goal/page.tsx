"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function GoalPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      <div className="container max-w-screen-xl py-16 md:py-24 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Our Goal
          </h1>

          <p className="text-xl text-gray-300">
            At Quantercise, we&apos;re driven by a simple yet ambitious mission:
          </p>

          <blockquote className="border-l-4 border-primary pl-4 py-3 text-2xl md:text-3xl italic text-white">
            Provide children with resources and opportunity to learn calculus
            before high school.
          </blockquote>

          <div className="space-y-6 text-gray-300">
            <p>
              Mathematics is the universal language of problem-solving, critical
              thinking, and innovation. Yet, in many educational systems,
              advanced mathematical concepts like calculus are reserved for the
              final years of high school or even college.
            </p>

            <p>
              We believe that young minds are extraordinarily capable of
              understanding complex mathematical concepts when presented in the
              right way. Our approach breaks down advanced topics into
              accessible, engaging content that builds confidence and
              competence.
            </p>

            <p>
              By introducing calculus concepts earlier, we&apos;re not just
              teaching math—we&apos;re cultivating a mindset of analysis,
              abstraction, and problem-solving that will benefit children
              throughout their lives, regardless of their future career paths.
            </p>

            <p>
              Through our platform, we aim to democratize access to advanced
              mathematics education, making it available to all curious young
              minds, not just those with access to specialized schools or
              programs.
            </p>
          </div>

          <div className="pt-6">
            <Link href="/">
              <Button className="mr-4">Return to Home</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Try Quantercise</Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
