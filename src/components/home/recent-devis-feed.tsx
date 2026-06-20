"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/badge";
import { formatDevisNumber, formatDt, formatDate } from "@/lib/format";
import { statusTone, type RecentDevis } from "./types";

export function RecentDevisFeed({ rows }: { rows: RecentDevis[] }) {
  const { t } = useI18n();
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink/45">
        {t.overview.noRecent}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {rows.map((d) => {
        const baseUrl =
          d.kind === "facture" ? "/dashboard/factures" : "/dashboard/devis";
        const statusKey = d.status as keyof typeof t.devis.status;
        const statusText = t.devis.status[statusKey] ?? d.status;
        return (
          <li key={d.id}>
            <Link
              href={`${baseUrl}/${d.id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/8"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  d.kind === "facture"
                    ? "bg-brand/15 text-brand-light"
                    : "bg-brand/10 text-brand"
                }`}
              >
                {d.kind === "facture" ? "FA" : "DE"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {d.client_name}
                </p>
                <p className="truncate text-xs text-ink/50">
                  {formatDevisNumber(d.devis_number, d.kind)} ·{" "}
                  {formatDate(d.date)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={statusTone[d.status]}>{statusText}</Badge>
                <span className="text-sm font-semibold text-ink">
                  {formatDt(d.total_dt)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
