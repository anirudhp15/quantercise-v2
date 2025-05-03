"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { BarChart, LineChart, Clock, Calendar } from "lucide-react";

type Activity = {
  type: string;
  name: string;
  time: string;
  score?: string;
  duration?: string;
};

type DayActivity = {
  date: string;
  activities: Activity[];
};

export default function ProgressPage() {
  const subjects = [
    { name: "Algebra", progress: 92, change: "+4%" },
    { name: "Precalculus", progress: 78, change: "+12%" },
    { name: "Calculus", progress: 45, change: "+8%" },
    { name: "Statistics", progress: 23, change: "New" },
  ];

  const recentActivity: DayActivity[] = [
    {
      date: "Today",
      activities: [
        {
          type: "Completed",
          name: "Derivatives Quiz",
          time: "2 hours ago",
          score: "85%",
        },
        { type: "Started", name: "Integration Basics", time: "5 hours ago" },
      ],
    },
    {
      date: "Yesterday",
      activities: [
        {
          type: "Completed",
          name: "Algebra Review",
          time: "1 day ago",
          score: "92%",
        },
        {
          type: "Practiced",
          name: "Functions and Graphs",
          time: "1 day ago",
          duration: "45 min",
        },
      ],
    },
    {
      date: "This Week",
      activities: [
        {
          type: "Achieved",
          name: "Calculus Beginner Badge",
          time: "3 days ago",
        },
        {
          type: "Completed",
          name: "Limits Introduction",
          time: "4 days ago",
          score: "78%",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl pl-16 font-bold tracking-tight">
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track your learning journey and achievements
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subject Progress</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Your progress by subject area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{subject.name}</div>
                    <div className="flex items-center space-x-2">
                      <span>{subject.progress}%</span>
                      <span className="text-xs text-primary">
                        {subject.change}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-primary/20">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Activity</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Your learning activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[180px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Interactive chart coming soon...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>Your recent learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recentActivity.map((day) => (
              <div key={day.date} className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                  <h3 className="text-sm font-medium">{day.date}</h3>
                </div>
                <div className="ml-6 space-y-3 border-l  pl-6">
                  {day.activities.map((activity, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[22px] mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary"></div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="font-medium">{activity.type}</span>
                          <span className="mx-1">•</span>
                          <span>{activity.name}</span>
                          {activity.score && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="text-primary">
                                {activity.score}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex text-xs text-muted-foreground">
                          <span>{activity.time}</span>
                          {activity.duration && (
                            <>
                              <span className="mx-1">•</span>
                              <span>Duration: {activity.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
