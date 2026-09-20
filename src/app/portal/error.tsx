"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error("[portal]", error), [error]);
  return (
    <div className="grid min-h-[50vh] place-items-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-2 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-light">Connection issue</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">We could not load this page</h1>
        <p className="mt-2 text-sm text-cream/65">Your work is safe. Try again or return to your portal home.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Try again</button>
          <Link href="/portal" className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Portal home</Link>
        </div>
      </section>
    </div>
  );
}
