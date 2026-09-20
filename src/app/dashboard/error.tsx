"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="grid min-h-[55vh] place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-2 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-light">Connection issue</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">This page could not load</h1>
        <p className="mt-2 text-sm leading-relaxed text-cream/65">Your work is still saved. Try again, or return to the overview.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset} size="sm">
              Retry
            </Button>
            <a href="/dashboard" className="inline-flex h-8 items-center justify-center rounded-md border border-white/15 px-3 text-sm font-medium text-white hover:bg-white/10">Overview</a>
          </div>
      </section>
    </div>
  );
}
