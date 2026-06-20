"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { formatDt } from "@/lib/format";

export type HotLead = {
  id: string;
  name: string;
  status: string;
  value: number | null;
  contact: string | null;
};

const stageTone: Record<string, "blue" | "amber"> = {
  contacted: "blue",
  qualified: "amber",
};
const stageLabel: Record<string, string> = {
  contacted: "Contacted",
  qualified: "Qualified",
};

/** The leads worth chasing now — qualified first, then contacted. */
export function HotLeadsList({ leads }: { leads: HotLead[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hot leads</CardTitle>
          <Link
            href="/dashboard/leads"
            className="text-xs font-semibold text-brand hover:text-brand-dark"
          >
            See pipeline
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">
            No warm leads right now — time to prospect.
          </p>
        ) : (
          <ul className="space-y-1">
            {leads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/dashboard/leads/${l.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/8"
                >
                  <Avatar name={l.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {l.name}
                    </p>
                    {l.contact && (
                      <p className="truncate text-xs text-ink/50">{l.contact}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={stageTone[l.status] ?? "slate"}>
                      {stageLabel[l.status] ?? l.status}
                    </Badge>
                    {l.value !== null && (
                      <span className="text-sm font-semibold text-ink">
                        {formatDt(l.value)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
