"use client";

import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/charts/count-up";
import { Sparkline } from "@/components/charts/sparkline";
import { TrendPill } from "@/components/charts/trend-pill";

export type MomentumTile = {
  /** Big number. Omit for a pure-text/sparkline tile. */
  value?: number;
  suffix?: string;
  decimals?: number;
  label: string;
  /** Optional encouraging line when value is 0. */
  emptyHint?: string;
  /** 🔥 streak badge value (renders 🔥 when ≥2). */
  streak?: number;
  /** Optional trend % vs a prior period. */
  trend?: number | null;
  /** Optional 7-point sparkline (e.g. team energy). */
  spark?: number[];
};

/**
 * A row of momentum tiles built on real data. When a tile's value is 0 and it
 * has an emptyHint, we show the hint instead of a bare "0" — momentum should
 * encourage, never shame.
 */
export function MomentumStrip({ tiles }: { tiles: MomentumTile[] }) {
  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile, i) => {
        const isEmpty = (tile.value ?? 0) === 0 && !tile.spark;
        return (
          <Card key={i} interactive className="relative overflow-hidden">
            <div className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">
                  {tile.label}
                </p>
                {tile.streak && tile.streak >= 2 ? (
                  <span className="shrink-0 text-sm" aria-hidden>
                    🔥
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-1 flex-col justify-end">
                {tile.spark && tile.spark.length >= 2 ? (
                  <div className="mb-1">
                    <Sparkline
                      values={tile.spark}
                      width={150}
                      height={40}
                      color="#FF2A2A"
                    />
                  </div>
                ) : null}

                {tile.value !== undefined && (
                  <p className="text-[30px] font-display font-extrabold leading-none tracking-tight text-ink tabular-nums">
                    <CountUp
                      to={tile.value}
                      decimals={tile.decimals ?? 0}
                      suffix={tile.suffix}
                    />
                    {tile.streak && tile.streak >= 2 ? (
                      <span className="ml-1.5 align-middle text-sm font-bold text-brand-light">
                        ×{tile.streak}
                      </span>
                    ) : null}
                  </p>
                )}

                {isEmpty && tile.emptyHint ? (
                  <p className="mt-2 text-xs text-ink/45">{tile.emptyHint}</p>
                ) : null}

                {tile.trend !== undefined && tile.trend !== null && !isEmpty ? (
                  <div className="mt-2.5">
                    <TrendPill pct={tile.trend} />
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </section>
  );
}
