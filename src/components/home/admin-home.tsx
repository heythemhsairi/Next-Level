"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Donut, DonutLegend, type DonutSlice } from "@/components/charts/donut";
import { MonthlyBars, type BarPoint } from "@/components/charts/bars";
import type { Momentum } from "@/lib/momentum";
import { HomeHero } from "./home-hero";
import { MomentumStrip } from "./momentum-strip";
import { FeaturedCard, FeaturedEmptyCta } from "./cards";
import { RecentDevisFeed } from "./recent-devis-feed";
import { UpcomingTasksList } from "./tasks-lists";
import { pctTrend } from "./types";
import type { Revenue, Featured, RecentDevis, UpcomingTask } from "./types";

/**
 * Admin "Studio Command Center" — cinematic pulse hero, momentum strip on
 * real data, revenue + service mix, recent quotes + upcoming work, featured
 * teammate. Reuses the existing charts and lifted home cards.
 */
export function AdminHome({
  firstName,
  revenue,
  momentum,
  monthlySeries,
  donutData,
  recentDevis,
  upcomingTasks,
  featuredEmployee,
}: {
  firstName: string;
  revenue: Revenue;
  momentum: Momentum;
  monthlySeries: BarPoint[];
  donutData: DonutSlice[];
  recentDevis: RecentDevis[];
  upcomingTasks: UpcomingTask[];
  featuredEmployee: Featured;
}) {
  const collectionRate =
    revenue.mtdInvoiced > 0
      ? Math.min(100, (revenue.mtdPaid / revenue.mtdInvoiced) * 100)
      : 0;

  const deliveredTrend = pctTrend(
    momentum.deliveredThisWeek,
    momentum.deliveredLastWeek,
  );
  const collectedTrend = pctTrend(
    momentum.collectedThisMonth,
    momentum.collectedLastMonth,
  );

  return (
    <div className="space-y-7">
      <HomeHero
        eyebrow="Studio · Command Center"
        firstName={firstName}
        tagline="Money, delivery, and your team — at a glance."
        ringValue={revenue.mtdInvoiced > 0 ? collectionRate : null}
        ringLabel="collected of invoiced"
        streak={
          momentum.deliveryStreak >= 2
            ? { count: momentum.deliveryStreak, label: "shipped in a row" }
            : undefined
        }
        stats={[
          { value: revenue.mtdPaid, label: "Collected (MTD)", suffix: " DT" },
          { value: momentum.deliveredThisWeek, label: "Shipped this week" },
          { value: momentum.leadsWon, label: "Leads won" },
        ]}
      />

      <MomentumStrip
        tiles={[
          {
            label: "Delivered this week",
            value: momentum.deliveredThisWeek,
            trend: deliveredTrend,
            streak: momentum.deliveryStreak,
            emptyHint: "Ship your first this week 🎬",
          },
          {
            label: "Collected this month",
            value: momentum.collectedThisMonth,
            suffix: " DT",
            trend: collectedTrend,
            emptyHint: "No payments in yet",
          },
          {
            label: "Collection rate",
            value: Math.round(collectionRate),
            suffix: "%",
            emptyHint: "Send your first invoice",
          },
          {
            label: "Team energy · 7d",
            spark: momentum.teamEnergy,
            value: momentum.teamEnergy.reduce((a, b) => a + b, 0),
            emptyHint: "Quiet week so far",
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue · last 12 months</CardTitle>
              <Link
                href="/dashboard/finance"
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                Finance details
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <MonthlyBars series={monthlySeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service mix</CardTitle>
            <p className="text-xs text-ink/50">Revenue by service (signed + sent)</p>
          </CardHeader>
          <CardContent>
            {donutData.length > 0 ? (
              <div className="space-y-4">
                <Donut data={donutData} size={180} thickness={20} />
                <DonutLegend data={donutData.slice(0, 5)} />
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-ink/50">
                No service revenue yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {featuredEmployee && (
        <FeaturedCard featured={featuredEmployee} canEdit />
      )}
      {!featuredEmployee && <FeaturedEmptyCta />}

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent quotes & invoices</CardTitle>
              <Link
                href="/dashboard/devis"
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RecentDevisFeed rows={recentDevis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming deadlines</CardTitle>
              <Link
                href="/dashboard/tasks"
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                See all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <UpcomingTasksList rows={upcomingTasks} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
