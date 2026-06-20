"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDt } from "@/lib/format";

type Stage = { key: string; label: string; count: number };

/**
 * Lead pipeline as a set of proportional bars (new → contacted → qualified →
 * won), plus the open pipeline value. Honest: bars scale to the biggest stage;
 * an all-zero pipeline shows an encouraging empty state.
 */
export function PipelineFunnel({
  stages,
  openValue,
}: {
  stages: Stage[];
  openValue: number;
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  const total = stages.reduce((a, s) => a + s.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pipeline</CardTitle>
          <Link
            href="/dashboard/leads"
            className="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            Open leads
          </Link>
        </div>
        <p className="text-xs text-ink/50">
          {formatDt(openValue)} in open pipeline
        </p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">
            No leads yet — add your first to start the pipeline.
          </p>
        ) : (
          <ul className="space-y-3">
            {stages.map((s) => {
              const pct = (s.count / max) * 100;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium text-ink/60">
                    {s.label}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/[0.05]">
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-brand to-brand-dark px-2 transition-all duration-700"
                      style={{ width: `${Math.max(pct, s.count > 0 ? 12 : 0)}%` }}
                    >
                      {s.count > 0 && (
                        <span className="text-[11px] font-bold text-white tabular-nums">
                          {s.count}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
