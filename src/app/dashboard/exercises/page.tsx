"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { BookOpen, Star } from "lucide-react";

export default function ExercisesPage() {
  const categories = [
    {
      name: "Algebra",
      description: "Fundamental algebraic concepts",
      courses: [
        {
          title: "Algebra I: Basics",
          level: "Beginner",
          lessons: 12,
          completion: 100,
        },
        {
          title: "Algebra II: Advanced Topics",
          level: "Intermediate",
          lessons: 16,
          completion: 75,
        },
      ],
    },
    {
      name: "Calculus",
      description: "Fundamental calculus concepts",
      courses: [
        {
          title: "Calculus I: Limits and Derivatives",
          level: "Intermediate",
          lessons: 14,
          completion: 42,
        },
        {
          title: "Calculus II: Integration",
          level: "Advanced",
          lessons: 12,
          completion: 0,
        },
      ],
    },
    {
      name: "Precalculus",
      description: "Preparation for calculus",
      courses: [
        {
          title: "Trigonometry",
          level: "Intermediate",
          lessons: 10,
          completion: 90,
        },
        {
          title: "Functions and Graphs",
          level: "Intermediate",
          lessons: 8,
          completion: 100,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
        <p className="text-muted-foreground">
          Explore our math curriculum and continue your learning journey
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((category) => (
          <div key={category.name} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {category.courses.map((course) => (
                <Card key={course.title} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <div className="flex items-center text-xs">
                        <Star className="h-3 w-3 fill-primary text-primary mr-1" />
                        <span className="text-muted-foreground">
                          {course.level}
                        </span>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      <span>{course.lessons} Lessons</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {course.completion}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-primary/20">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${course.completion}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end">
                        <button className="text-sm text-primary hover:underline">
                          {course.completion > 0 ? "Continue" : "Start Course"}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
