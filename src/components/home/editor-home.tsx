"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Momentum } from "@/lib/momentum";
import { HomeHero } from "./home-hero";
import { MomentumStrip } from "./momentum-strip";
import { MyTasksList } from "./tasks-lists";
import type { Counts, UpcomingTask } from "./types";

/**
 * Editor "Production Focus" — a calm, personal home. Hero shows today's load;
 * momentum celebrates what shipped; the body is my active work.
 */
export function EditorHome({
  firstName,
  counts,
  momentum,
  myTasks,
}: {
  firstName: string;
  counts: Counts;
  momentum: Momentum;
  myTasks: UpcomingTask[];
}) {
  return (
    <div className="space-y-7">
      <HomeHero
        eyebrow="Production · Focus"
        firstName={firstName}
        tagline="Here's your work today — one thing at a time."
        streak={
          momentum.deliveryStreak >= 2
            ? { count: momentum.deliveryStreak, label: "shipped in a row" }
            : undefined
        }
        stats={[
          { value: counts.myActiveTasks, label: "Active tasks" },
          { value: counts.myOverdueTasks, label: "Overdue" },
          { value: momentum.deliveredThisWeek, label: "Shipped this week" },
        ]}
      />

      <MomentumStrip
        tiles={[
          {
            label: "Tasks shipped this week",
            value: momentum.tasksShippedThisWeek,
            emptyHint: "Move one to done to get rolling 🚀",
          },
          {
            label: "Delivered this week",
            value: momentum.deliveredThisWeek,
            streak: momentum.deliveryStreak,
            emptyHint: "Your next delivery starts the streak",
          },
          {
            label: "Active tasks",
            value: counts.myActiveTasks,
            emptyHint: "Inbox zero — nice.",
          },
          {
            label: "Active projects",
            value: counts.activeProjects,
            emptyHint: "No active projects",
          },
        ]}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My tasks</CardTitle>
            <Link
              href="/dashboard/tasks"
              className="text-xs font-semibold text-brand hover:text-brand-dark"
            >
              See all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <MyTasksList rows={myTasks} />
        </CardContent>
      </Card>
    </div>
  );
}
