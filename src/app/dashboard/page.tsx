"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, BookOpen, Clock, ArrowRight } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col gap-4">
        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <motion.p variants={itemVariants} className="text-muted-foreground">
          Welcome back to your Quantercise dashboard!
        </motion.p>
      </div>

      <motion.div
        variants={containerVariants}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Your Progress
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67%</div>
              <p className="text-xs text-muted-foreground">
                +2% from last week
              </p>
              <div className="mt-4">
                <Progress value={67} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Exercises
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Completed this week
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Derivatives Practice</span>
                  <span className="text-muted-foreground">Today</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Integration Basics</span>
                  <span className="text-muted-foreground">Yesterday</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3h 24m</div>
              <p className="text-xs text-muted-foreground">This week</p>
              <div className="mt-4">
                <Progress value={75} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link
                href="/dashboard/exercises/calculus-1"
                className="group flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary group-hover:bg-primary/20">
                  f(x)
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">Calculus I</p>
                  <p className="text-sm text-muted-foreground">
                    Lesson 4: The Power Rule
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">67%</div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/dashboard/exercises/algebra-2"
                className="group flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary group-hover:bg-primary/20">
                  x²
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">Algebra II</p>
                  <p className="text-sm text-muted-foreground">
                    Lesson 8: Quadratic Equations
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">100%</div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Recommended For You</CardTitle>
              <CardDescription>Based on your progress</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link
                href="/dashboard/exercises/precalculus"
                className="group flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary group-hover:bg-primary/20">
                  sin
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">Precalculus</p>
                  <p className="text-sm text-muted-foreground">
                    Trigonometric Functions
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">New</div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                href="/dashboard/exercises/limits"
                className="group flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-primary/10 text-primary group-hover:bg-primary/20">
                  lim
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">Limits</p>
                  <p className="text-sm text-muted-foreground">
                    Introduction to Limits
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Recommended
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
