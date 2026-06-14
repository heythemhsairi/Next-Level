"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { sendMessageAction } from "../actions";

export type ThreadMessage = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  is_mine: boolean;
};

export function MessageThread({
  clientId,
  messages,
}: {
  clientId: string;
  messages: ThreadMessage[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("client_id", clientId);
    start(async () => {
      const res = await sendMessageAction(fd);
      if (res.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Card variant="ink" className="max-w-3xl">
      <CardContent className="space-y-4 p-5 md:p-6">
        {messages.length === 0 ? (
          <p className="text-sm text-ink/50">No messages yet.</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.is_mine
                    ? "ml-8 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-sm"
                    : "mr-8 rounded-lg bg-white/5 px-3 py-2 text-sm"
                }
              >
                <p className="whitespace-pre-wrap text-ink/90">{m.body}</p>
                <p className="mt-1 text-[11px] text-ink/40">
                  {m.author_name} · {formatDate(m.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 pt-2">
          <input
            name="body"
            required
            placeholder="Write a message…"
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
