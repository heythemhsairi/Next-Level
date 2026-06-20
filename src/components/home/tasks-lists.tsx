"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { priorityTone, myStatusTone, type UpcomingTask } from "./types";

/** Compact "next deadlines" list used on the admin home. */
export function UpcomingTasksList({ rows }: { rows: UpcomingTask[] }) {
  const { t } = useI18n();
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink/45">
        {t.overview.noUpcoming}
      </p>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <ul className="space-y-1">
      {rows.map((task) => {
        const due = new Date(task.deadline);
        const days = Math.floor(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = days < 0;
        const isSoon = days >= 0 && days <= 3;
        const priKey = task.priority as keyof typeof t.tasks.priority;
        const priorityText = t.tasks.priority[priKey] ?? task.priority;

        return (
          <li key={task.id}>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/8"
            >
              {task.assignee ? (
                <Avatar
                  src={task.assignee.avatar}
                  name={task.assignee.name}
                  size="sm"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs text-ink/40">
                  ?
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {task.title}
                </p>
                <p className="truncate text-xs text-ink/50">
                  {task.client} · {task.project}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={priorityTone[task.priority]}>
                  {priorityText}
                </Badge>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isOverdue
                      ? "bg-red-500/15 text-red-300"
                      : isSoon
                        ? "bg-brand/15 text-brand"
                        : "bg-white/8 text-ink/55"
                  }`}
                >
                  {isOverdue
                    ? t.overview.relativeOverdue(days)
                    : days === 0
                      ? t.overview.relativeTodayShort
                      : t.overview.relativeIn(days)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Richer card list used on the non-admin (editor) home. */
export function MyTasksList({ rows }: { rows: UpcomingTask[] }) {
  const { t } = useI18n();
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-ink/45">{t.overview.noMine}</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <ul className="space-y-1.5">
      {rows.map((task) => {
        const due = new Date(task.deadline);
        const days = Math.floor(
          (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = days < 0;
        const isToday = days === 0;
        const isSoon = days > 0 && days <= 3;
        const statusKey = task.status as keyof typeof t.tasks.status;
        const statusText = t.tasks.status[statusKey] ?? task.status;
        const priKey = task.priority as keyof typeof t.tasks.priority;
        const priorityText = t.tasks.priority[priKey] ?? task.priority;

        return (
          <li key={task.id}>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="group block rounded-xl border border-white/15 bg-white/8 p-3 transition-all hover:border-brand/30 hover:bg-white/12 hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink group-hover:text-brand">
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink/50">
                    {task.client} · {task.project}
                  </p>
                </div>
                <Badge
                  tone={myStatusTone[task.status] ?? "slate"}
                  dot={task.status === "in_progress" ? "pulse" : true}
                >
                  {statusText}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <Badge tone={priorityTone[task.priority]}>
                  {priorityText}
                </Badge>
                <span
                  className={`rounded-md px-2 py-0.5 font-semibold ${
                    isOverdue
                      ? "bg-red-500/15 text-red-300"
                      : isToday
                        ? "bg-brand/20 text-brand"
                        : isSoon
                          ? "bg-brand/12 text-brand"
                          : "bg-white/8 text-ink/55"
                  }`}
                >
                  {isOverdue
                    ? t.overview.relativeOverdueLong(days)
                    : isToday
                      ? t.overview.relativeTodayLong
                      : t.overview.relativeInLong(days)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
