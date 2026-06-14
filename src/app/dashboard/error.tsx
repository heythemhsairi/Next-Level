"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="grid min-h-screen place-items-center bg-cream bg-mesh px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-ink/70">
            The dashboard page could not be loaded. Details below
            (share with support if needed):
          </p>
          <pre className="overflow-x-auto rounded-md bg-ink/5 p-3 text-xs text-ink/80">
            {error.message || "Unknown error"}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
          <div className="flex gap-2">
            <Button onClick={reset} size="sm">
              Retry
            </Button>
            <a
              href="/dashboard"
              className="inline-flex h-8 items-center justify-center rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink hover:bg-cream-dark"
            >
              Reload the page
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
