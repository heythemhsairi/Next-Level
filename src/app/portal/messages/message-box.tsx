"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { sendClientMessageAction } from "./actions";

export type MessageItem = {
  id: string;
  body: string;
  created_at: string;
  author_label: string;
  is_mine: boolean;
  is_staff: boolean;
};

export function MessageBox({ messages }: { messages: MessageItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement | null>(null);

  // Keep the latest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    start(async () => {
      const res = await sendClientMessageAction(fd);
      if (res.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink/50">
            No messages yet. Say hello to your team below.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col",
                m.is_mine ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.is_mine
                    ? "bg-brand/15 text-ink/90 ring-1 ring-brand/20"
                    : "bg-white/5 text-ink/85 ring-1 ring-white/10",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
              <p className="mt-1 px-1 text-[11px] text-ink/40">
                {m.is_mine ? "You" : m.author_label} · {formatDate(m.created_at)}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Write a message to your team…"
          className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink/90 placeholder:text-ink/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
