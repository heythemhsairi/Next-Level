"use client";

import { useMemo, useState } from "react";

export type CalendarPost = {
  id: string;
  title: string;
  scheduledAt: string | null; // ISO timestamp
  platforms: string[];
  status: string; // draft | scheduled | published | cancelled
  content?: string;
  projectName?: string | null;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_META: Record<
  string,
  { label: string; dot: string; chip: string }
> = {
  draft: {
    label: "Draft",
    dot: "bg-white/40",
    chip: "bg-white/[0.06] text-cream/70 ring-1 ring-white/10",
  },
  scheduled: {
    label: "Scheduled",
    dot: "bg-sky-400",
    chip: "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/25",
  },
  published: {
    label: "Published",
    dot: "bg-emerald-400",
    chip: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-rose-400",
    chip: "bg-rose-400/15 text-rose-200 ring-1 ring-rose-400/25",
  },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META.draft;
}

// Local YYYY-MM-DD key (timezone-safe: uses the viewer's local date parts).
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContentCalendar({ posts }: { posts: CalendarPost[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selected, setSelected] = useState<CalendarPost | null>(null);

  // Group posts by local date key.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const key = dateKey(new Date(p.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
      );
    }
    return map;
  }, [posts]);

  // Posts within the visible month (for summary + mobile agenda).
  const monthPosts = useMemo(() => {
    return posts
      .filter((p) => {
        if (!p.scheduledAt) return false;
        const d = new Date(p.scheduledAt);
        return d.getFullYear() === cursor.year && d.getMonth() === cursor.month;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
      );
  }, [posts, cursor]);

  const publishedCount = monthPosts.filter((p) => p.status === "published").length;

  // Use only the weeks needed for this month, starting Monday.
  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const start = new Date(cursor.year, cursor.month, 1 - startOffset);
    return Array.from({ length: cellCount }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return d;
    });
  }, [cursor]);

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function goToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
  }

  const todayKey = dateKey(today);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-cream">
          {MONTHS[cursor.month]} {cursor.year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-lg border border-white/10 p-1.5 text-cream/70 hover:bg-white/[0.06]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-cream/70 hover:bg-white/[0.06]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-lg border border-white/10 p-1.5 text-cream/70 hover:bg-white/[0.06]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
        <div className="ml-auto text-sm text-cream/60">
          {monthPosts.length} post{monthPosts.length === 1 ? "" : "s"}
          {monthPosts.length > 0 && (
            <span className="text-cream/40"> · {publishedCount} published</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cream/55">
        {Object.entries(STATUS_META).map(([k, m]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${m.dot}`} />
            {m.label}
          </span>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="mt-4 hidden md:block">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="bg-white/[0.03] px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-cream/45"
            >
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            const key = dateKey(d);
            const inMonth = d.getMonth() === cursor.month;
            const dayPosts = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={i}
                className={`min-h-[104px] bg-ink/40 p-1.5 ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                <div
                  className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                    isToday
                      ? "bg-brand text-white"
                      : "text-cream/60"
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((p) => {
                    const m = statusMeta(p.status);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(p)}
                        className={`flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left text-[11px] leading-tight ${m.chip}`}
                        title={p.title}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} />
                        <span className="truncate">{p.title}</span>
                      </button>
                    );
                  })}
                  {dayPosts.length > 3 && (
                    <div className="px-1.5 text-[10px] text-cream/45">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile agenda */}
      <div className="mt-4 md:hidden">
        {monthPosts.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-cream/50">
            No content scheduled this month yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {monthPosts.map((p) => {
              const m = statusMeta(p.status);
              const d = new Date(p.scheduledAt!);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left"
                  >
                    <div className="flex w-11 shrink-0 flex-col items-center">
                      <span className="text-[10px] uppercase text-cream/45">
                        {d.toLocaleDateString([], { weekday: "short" })}
                      </span>
                      <span className="text-lg font-semibold text-cream">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-cream">
                        {p.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-cream/50">
                        <span className={`inline-flex items-center gap-1`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                          {m.label}
                        </span>
                        {p.platforms.length > 0 && (
                          <span className="truncate">
                            {p.platforms.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <PostDialog post={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function PostDialog({
  post,
  onClose,
}: {
  post: CalendarPost;
  onClose: () => void;
}) {
  const m = statusMeta(post.status);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-white/10 bg-ink p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-cream">{post.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-cream/60 hover:bg-white/[0.06]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${m.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
            {m.label}
          </span>
          {post.scheduledAt && (
            <span className="text-cream/60">
              {new Date(post.scheduledAt).toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              · {formatTime(post.scheduledAt)}
            </span>
          )}
        </div>
        {post.platforms.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.platforms.map((pl) => (
              <span
                key={pl}
                className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] capitalize text-cream/75 ring-1 ring-white/10"
              >
                {pl}
              </span>
            ))}
          </div>
        )}
        {post.content && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cream/75">
            {post.content}
          </p>
        )}
        {post.projectName && (
          <p className="mt-3 text-xs text-cream/45">Project: {post.projectName}</p>
        )}
      </div>
    </div>
  );
}
