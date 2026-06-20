"use client";

import { CountUp } from "@/components/charts/count-up";
import { ProgressRing } from "@/components/charts/progress-ring";
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
 * Cinematic pulse band: scarlet gradient hero with a greeting and a live
 * "pulse" row — an optional collection-rate ring plus up to three stats.
 * Shared by every role home; copy + stats are passed in per role.
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
  return (
    <section className="reveal relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-brand via-brand-dark to-[#170406] p-6 shadow-brand-glow sm:p-8 surface-grain">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-light/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-brand/40 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] font-display font-bold uppercase tracking-[0.22em] text-cream/80">
          {eyebrow}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-white md:text-[38px]">
            {greetingTime()}, {firstName} 👋
          </h1>
          {streak && <StreakChip count={streak.count} label={streak.label} className="!bg-white/15 !text-white !ring-white/25" />}
        </div>
        {tagline && <p className="mt-1.5 text-sm text-cream/70">{tagline}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5">
          {ringValue !== null && ringValue !== undefined && (
            <div className="flex items-center gap-3">
              <ProgressRing
                value={ringValue}
                size={66}
                thickness={7}
                color="#FFFFFF"
                trackColor="rgba(0,0,0,0.25)"
                label={
                  <span className="text-sm font-bold text-white tabular-nums">
                    {Math.round(ringValue)}%
                  </span>
                }
              />
              {ringLabel && (
                <span className="max-w-[7rem] text-xs font-medium leading-tight text-cream/75">
                  {ringLabel}
                </span>
              )}
            </div>
          )}

          {stats.map((s, i) => (
            <div key={i} className="min-w-[5rem]">
              <p className="text-2xl font-display font-extrabold leading-none text-white tabular-nums md:text-[28px]">
                <CountUp
                  to={s.value}
                  decimals={s.decimals ?? 0}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-cream/65">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
