"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { addStaffFeedbackAction } from "./feedback-actions";

export type ThreadItem = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  is_client: boolean;
};

export function FeedbackThread({
  deliverableId,
  items,
}: {
  deliverableId: string;
  items: ThreadItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("deliverable_id", deliverableId);
    start(async () => {
      const res = await addStaffFeedbackAction(fd);
      if (res.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Client feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink/50">No feedback yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((f) => (
              <li
                key={f.id}
                className={
                  f.is_client
                    ? "rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-sm"
                    : "rounded-lg bg-white/5 px-3 py-2 text-sm"
                }
              >
                <p className="text-ink/85">{f.body}</p>
                <p className="mt-0.5 text-[11px] text-ink/40">
                  {f.author_name}
                  {f.is_client ? " (client)" : ""} · {formatDate(f.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            name="body"
            required
            placeholder="Reply to the client…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink/90 placeholder:text-ink/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "…" : "Send"}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
