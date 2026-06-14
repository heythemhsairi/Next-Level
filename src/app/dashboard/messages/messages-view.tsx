"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/format";

export type ConversationRow = {
  id: string;
  name: string;
  last_body: string | null;
  last_at: string | null;
};

export function MessagesView({
  conversations,
}: {
  conversations: ConversationRow[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows =
      q.length > 0
        ? conversations.filter((c) => c.name.toLowerCase().includes(q))
        : conversations;
    // Clients with recent activity float to the top; the rest stay A–Z.
    return [...rows].sort((a, b) => {
      if (a.last_at && b.last_at)
        return new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
      if (a.last_at) return -1;
      if (b.last_at) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [conversations, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Direct conversations with each client. Select a client to view and reply to their thread."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="ink" className="lg:col-span-1">
          <div className="border-b border-white/10 p-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink/90 placeholder:text-ink/35 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-ink/50">No clients found.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/messages/${c.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {c.name}
                      </span>
                      {c.last_at && (
                        <span className="shrink-0 text-[11px] text-ink/40">
                          {formatDate(c.last_at)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink/55">
                      {c.last_body ?? "No messages yet"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          variant="ink"
          className="hidden items-center justify-center p-10 text-center lg:col-span-2 lg:flex"
        >
          <p className="text-sm text-ink/45">
            Select a client to open the conversation.
          </p>
        </Card>
      </div>
    </div>
  );
}
