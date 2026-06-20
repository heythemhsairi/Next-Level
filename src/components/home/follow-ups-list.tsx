"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDevisNumber, formatDt } from "@/lib/format";
import type { StaleDevisRow } from "@/components/stale-devis-banner";

/** Quotes sent 7+ days ago, still unpaid — the follow-ups that close deals. */
export function FollowUpsList({ rows }: { rows: StaleDevisRow[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Follow up</CardTitle>
          <Link
            href="/dashboard/devis"
            className="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            All quotes
          </Link>
        </div>
        <p className="text-xs text-ink/50">Sent a while ago, still waiting</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">
            All caught up — nothing waiting on a reply. ✓
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((d) => {
              const baseUrl =
                d.kind === "facture" ? "/dashboard/factures" : "/dashboard/devis";
              return (
                <li key={d.id}>
                  <Link
                    href={`${baseUrl}/${d.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/8"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {d.client_name}
                      </p>
                      <p className="truncate text-xs text-ink/50">
                        {formatDevisNumber(d.devis_number, d.kind)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand-light">
                        {d.days_since_sent}d waiting
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        {formatDt(d.total_dt)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
