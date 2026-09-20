"use client";

import { CountUp } from "@/components/charts/count-up";
import { StreakChip } from "./streak-chip";

function greetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export type PulseStat = {
  /** Numeric value (animated with CountUp). */
  value: number;
  label: string;
  /** " DT", "%", etc. */
  suffix?: string;
  prefix?: string;
  decimals?: number;
};

/**
 * A calm, compact welcome with only the useful numbers for this role.
 */
export function HomeHero({
  eyebrow,
  firstName,
  tagline,
  ringValue,
  ringLabel,
  stats,
  streak,
}: {
  eyebrow: string;
  firstName: string;
  tagline?: string;
  /** 0..100 — renders the collection/win ring on the left of the pulse. */
  ringValue?: number | null;
  ringLabel?: string;
  stats: PulseStat[];
  streak?: { count: number; label: string };
}) {
  const visibleStats = stats.filter((stat) => stat.value > 0);
  return (
    <section className="reveal rounded-2xl border border-white/10 bg-ink-2 px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
        <p className="text-[11px] font-display font-bold uppercase tracking-[0.18em] text-brand-light">
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-balance text-2xl font-display font-bold tracking-tight text-white md:text-[30px]">
            {greetingTime()}, {firstName} 👋
          </h1>
          {streak && <StreakChip count={streak.count} label={streak.label} className="!bg-white/10 !text-white !ring-white/15" />}
        </div>
        {tagline && <p className="mt-1 text-sm text-cream/60">{tagline}</p>}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:border-t-0 sm:pt-0">
          {ringValue !== null && ringValue !== undefined && ringLabel && (
            <div className="min-w-[7rem]">
              <p className="text-xl font-display font-bold leading-none text-white tabular-nums">{Math.round(ringValue)}%</p>
              <p className="mt-1.5 text-[11px] text-cream/55">{ringLabel}</p>
            </div>
          )}
          {visibleStats.map((s) => (
            <div key={s.label} className="min-w-[6rem]">
              <p className="text-xl font-display font-bold leading-none text-white tabular-nums">
                <CountUp
                  to={s.value}
                  decimals={s.decimals ?? 0}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              </p>
              <p className="mt-1.5 text-[11px] text-cream/55">
                {s.label}
              </p>
            </div>
          ))}
          {visibleStats.length === 0 && ringValue == null && (
            <p className="max-w-44 text-sm text-cream/50">Your work and activity will appear here.</p>
          )}
        </div>
      </div>
    </section>
  );
}
