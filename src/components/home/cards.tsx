"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { CountUp } from "@/components/charts/count-up";
import { TrendPill } from "@/components/charts/trend-pill";
import { formatDt } from "@/lib/format";
import { formatMonth, type Featured } from "./types";

export function HeroRevenueCard({
  mtdPaid,
  mtdInvoiced,
  paidTrend,
}: {
  mtdPaid: number;
  mtdInvoiced: number;
  paidTrend: number | null;
}) {
  const { t } = useI18n();
  const collectionRate =
    mtdInvoiced > 0 ? Math.min(100, (mtdPaid / mtdInvoiced) * 100) : 0;

  return (
    <Card className="relative h-full overflow-hidden border-0 bg-gradient-to-br from-brand via-brand-dark to-[#1a0608] p-0 shadow-brand-glow lg:col-span-1 surface-grain">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-light/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-brand/40 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cream/70">
            {t.kpis.revenueMtd}
          </p>
          <TrendPill pct={paidTrend} className="!bg-white/15 !text-white !ring-0" />
        </div>

        <p className="mt-3 text-3xl font-semibold tracking-tight text-cream md:text-[34px]">
          <CountUp to={mtdPaid} decimals={0} suffix=" DT" />
        </p>
        <p className="mt-1 text-xs text-cream/60">
          {t.kpis.sumInvoiced(formatDt(mtdInvoiced))}
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-cream/80">
            <span>{t.kpis.collectionRate}</span>
            <span>{collectionRate.toFixed(0)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/25">
            <div
              className="h-full bg-gradient-to-r from-white/70 to-white transition-all duration-700"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function KpiCard({
  label,
  value,
  trend,
  invertTrend,
  currency,
  tone = "neutral",
  icon,
  trendSuffix,
  subStat,
  scaleMax,
}: {
  label: string;
  value: number;
  trend?: number | null;
  invertTrend?: boolean;
  currency?: boolean;
  tone?: "brand" | "amber" | "ink" | "neutral";
  icon?: React.ReactNode;
  trendSuffix?: string;
  /** Small contextual line under the value, e.g. "62% of invoiced". */
  subStat?: string;
  /** Optional value reference for the progress bar (0..scaleMax). */
  scaleMax?: number;
}) {
  // On-brand palette: every accent is red. `amber` (outstanding) uses a
  // muted red so it reads as "attention" without leaving the theme.
  const accent =
    tone === "amber"
      ? { chip: "bg-brand/12 text-brand-light", glow: "bg-brand/20", bar: "from-brand-light to-brand" }
      : tone === "ink"
        ? { chip: "bg-white/8 text-ink/80", glow: "bg-white/5", bar: "from-ink/40 to-ink/20" }
        : tone === "neutral"
          ? { chip: "bg-white/8 text-ink/70", glow: "bg-white/5", bar: "from-ink/30 to-ink/15" }
          : { chip: "bg-brand/15 text-brand", glow: "bg-brand/20", bar: "from-brand to-brand-dark" };

  const pct =
    scaleMax && scaleMax > 0
      ? Math.max(0, Math.min(100, (value / scaleMax) * 100))
      : value === 0
        ? 0
        : Math.min(100, 18 + Math.log10(Math.max(value, 1)) * 28);

  return (
    <Card interactive className="relative h-full overflow-hidden p-0">
      <div
        aria-hidden
        className={`pointer-events-none absolute -bottom-14 -right-14 h-40 w-40 rounded-full blur-3xl ${accent.glow}`}
      />
      <CardContent className="relative flex h-full flex-col px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
            {label}
          </p>
          {icon && (
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/8 ${accent.chip}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {icon}
              </svg>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center pt-4">
          <p className="text-[30px] font-bold leading-none tracking-tight text-ink">
            <CountUp to={value} decimals={0} suffix={currency ? " DT" : ""} />
          </p>
          {subStat && (
            <p className="mt-2 text-xs text-ink/45">{subStat}</p>
          )}
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full bg-gradient-to-r ${accent.bar} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2.5 flex min-h-[18px] items-center gap-2">
            {trend !== undefined ? (
              <>
                <TrendPill pct={trend} invert={invertTrend} />
                {trendSuffix && (
                  <span className="text-[11px] text-ink/45">{trendSuffix}</span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-ink/25">&nbsp;</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeaturedCard({
  featured,
  canEdit,
}: {
  featured: NonNullable<Featured>;
  canEdit: boolean;
}) {
  const name = featured.full_name ?? featured.username;
  const { t } = useI18n();
  return (
    <Card interactive className="relative overflow-hidden border-0 p-0">
      {/* Deep backdrop with floating brand blobs */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-dark via-[#1a0608] to-ink ring-1 ring-inset ring-white/12"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-brand/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 top-1/3 h-48 w-48 rounded-full bg-brand-light/20 blur-3xl"
      />

      <CardContent className="relative flex min-h-[140px] flex-col items-center gap-6 px-8 py-8 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        {/* Avatar with electric halo */}
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="absolute inset-0 -m-2.5 animate-pulse rounded-full bg-gradient-to-br from-brand-light via-brand to-brand-dark opacity-70 blur-xl"
          />
          <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-br from-brand-light via-brand to-brand-dark p-[2px]">
            <div className="h-full w-full rounded-full bg-ink" />
          </div>
          <Avatar
            src={featured.avatar_url}
            name={name}
            size="xl"
            className="relative ring-2 ring-brand/70 ring-offset-2 ring-offset-ink"
          />
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-12 text-2xl drop-shadow-md"
            aria-hidden
          >
            ⭐
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5 sm:pt-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[10.5px] font-bold uppercase leading-none tracking-[0.20em] text-brand-light ring-1 ring-brand/40">
              ✦ {t.featured.title}
            </span>
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cream/55">
              {formatMonth(featured.month, t.overview.months)}
            </span>
          </div>
          <h3 className="text-[28px] font-semibold leading-snug tracking-[-0.01em] text-white md:text-[32px]">
            {name}
          </h3>
          {featured.reason && (
            <p className="text-sm italic leading-relaxed text-cream/75">
              « {featured.reason} »
            </p>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center">
            <Link
              href="/dashboard/team/featured"
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-cream/95 backdrop-blur transition-all hover:border-brand/60 hover:bg-brand/30 hover:text-white"
            >
              {t.featured.edit}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FeaturedEmptyCta() {
  const { t } = useI18n();
  return (
    <Card className="border-dashed border-brand/30 bg-brand/5 dark:border-white/10 dark:bg-white/3">
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/12 text-lg text-brand">
            ✦
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              {t.featured.empty}
            </p>
            <p className="text-xs text-ink/55">{t.featured.emptyHint}</p>
          </div>
        </div>
        <Link
          href="/dashboard/team/featured"
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          {t.featured.designate}
        </Link>
      </CardContent>
    </Card>
  );
}
