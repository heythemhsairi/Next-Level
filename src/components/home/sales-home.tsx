"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Momentum } from "@/lib/momentum";
import type { StaleDevisRow } from "@/components/stale-devis-banner";
import { HomeHero } from "./home-hero";
import { MomentumStrip } from "./momentum-strip";
import { PipelineFunnel } from "./pipeline-funnel";
import { HotLeadsList, type HotLead } from "./hot-leads-list";
import { FollowUpsList } from "./follow-ups-list";
import { RecentDevisFeed } from "./recent-devis-feed";
import { pctTrend, type RecentDevis } from "./types";

export type PipelineData = {
  stageCounts: {
    new: number;
    contacted: number;
    qualified: number;
    won: number;
    lost: number;
  };
  openValue: number;
  hot: HotLead[];
};

/**
 * Sales "Pipeline Command Center" — lead-to-cash is the spine. Hero shows
 * this month's wins; momentum tracks win rate + collection; the body is the
 * pipeline funnel, follow-ups, recent quotes, and hot leads.
 */
export function SalesHome({
  firstName,
  momentum,
  pipeline,
  staleDevis,
  recentDevis,
}: {
  firstName: string;
  momentum: Momentum;
  pipeline: PipelineData;
  staleDevis: StaleDevisRow[];
  recentDevis: RecentDevis[];
}) {
  const collectedTrend = pctTrend(
    momentum.collectedThisMonth,
    momentum.collectedLastMonth,
  );

  return (
    <div className="space-y-7">
      <HomeHero
        eyebrow="Sales · Pipeline"
        firstName={firstName}
        tagline="Lead to cash — let's close."
        ringValue={momentum.winRate}
        ringLabel="win rate"
        streak={
          momentum.devisAcceptStreak >= 2
            ? { count: momentum.devisAcceptStreak, label: "quotes accepted" }
            : undefined
        }
        stats={[
          { value: momentum.leadsWon, label: "Leads won" },
          {
            value: momentum.collectedThisMonth,
            label: "Collected (MTD)",
            suffix: " DT",
          },
          { value: pipeline.stageCounts.qualified, label: "Qualified" },
        ]}
      />

      <MomentumStrip
        tiles={[
          {
            label: "Win rate",
            value: momentum.winRate ?? 0,
            suffix: "%",
            emptyHint: "Close your first to set a rate",
          },
          {
            label: "Leads won",
            value: momentum.leadsWon,
            emptyHint: "Your first win is close 💪",
          },
          {
            label: "Collected this month",
            value: momentum.collectedThisMonth,
            suffix: " DT",
            trend: collectedTrend,
            emptyHint: "No payments in yet",
          },
          {
            label: "Quotes accepted streak",
            value: momentum.devisAcceptStreak,
            streak: momentum.devisAcceptStreak,
            emptyHint: "Send a quote to start a streak",
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PipelineFunnel
          stages={[
            { key: "new", label: "New", count: pipeline.stageCounts.new },
            { key: "contacted", label: "Contacted", count: pipeline.stageCounts.contacted },
            { key: "qualified", label: "Qualified", count: pipeline.stageCounts.qualified },
            { key: "won", label: "Won", count: pipeline.stageCounts.won },
          ]}
          openValue={pipeline.openValue}
        />
        <FollowUpsList rows={staleDevis} />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HotLeadsList leads={pipeline.hot} />
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
      </section>
    </div>
  );
}
