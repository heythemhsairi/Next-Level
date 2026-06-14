"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  EmptyState,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  deleteDeliverableAction,
  type DeliverableStatus,
} from "./actions";
import { STATUS_LABEL, STATUS_ORDER, STATUS_TONE } from "./status";

export type DeliverableRow = {
  id: string;
  project_id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: DeliverableStatus;
  client_visible: boolean;
  delivered_at: string | null;
  created_at: string;
  project_name: string | null;
  client_name: string | null;
};

type Filter = "all" | DeliverableStatus;

export function DeliverablesView({
  deliverables,
}: {
  deliverables: DeliverableRow[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: deliverables.length,
      draft: 0,
      in_review: 0,
      approved: 0,
      delivered: 0,
      revision_requested: 0,
    };
    for (const d of deliverables) c[d.status] += 1;
    return c;
  }, [deliverables]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = deliverables;
    if (filter !== "all") rows = rows.filter((d) => d.status === filter);
    if (q.length > 0) {
      rows = rows.filter((d) =>
        `${d.title} ${d.project_name ?? ""} ${d.client_name ?? ""}`
          .toLowerCase()
          .includes(q),
      );
    }
    return rows;
  }, [deliverables, search, filter]);

  function onDelete(d: DeliverableRow) {
    if (!confirm(`Delete deliverable "${d.title}"?`)) return;
    const fd = new FormData();
    fd.set("id", d.id);
    fd.set("project_id", d.project_id);
    fd.set("stay", "1");
    startTransition(async () => {
      await deleteDeliverableAction(fd);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliverables"
        description="Videos produced for projects. Toggle visibility to share them with clients."
        action={
          <Link href="/dashboard/deliverables/new">
            <Button>New deliverable</Button>
          </Link>
        }
      />

      {deliverables.length === 0 ? (
        <EmptyState>No deliverables yet.</EmptyState>
      ) : (
        <>
          <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 md:px-5">
            <div className="relative min-w-[220px] flex-1">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deliverables…"
                className="w-full rounded-lg border border-ink/10 bg-white/70 py-2 px-3 text-sm text-ink placeholder:text-ink/40 transition-colors focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label={`All (${counts.all})`}
              />
              {STATUS_ORDER.map((s) => (
                <FilterChip
                  key={s}
                  active={filter === s}
                  onClick={() => setFilter(s)}
                  label={`${STATUS_LABEL[s]} (${counts[s]})`}
                />
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState>No deliverables match your filters.</EmptyState>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Project</TH>
                  <TH>Status</TH>
                  <TH>Client visible</TH>
                  <TH>Video</TH>
                  <TH>Created</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((d) => (
                  <TR key={d.id}>
                    <TD className="font-medium text-ink">
                      <Link
                        href={`/dashboard/deliverables/${d.id}`}
                        className="hover:text-brand"
                      >
                        {d.title}
                      </Link>
                    </TD>
                    <TD className="text-ink/70">
                      {d.project_name ?? "—"}
                      {d.client_name && (
                        <span className="text-ink/45">
                          {" "}
                          · {d.client_name}
                        </span>
                      )}
                    </TD>
                    <TD>
                      <Badge tone={STATUS_TONE[d.status]} dot>
                        {STATUS_LABEL[d.status]}
                      </Badge>
                    </TD>
                    <TD>
                      {d.client_visible ? (
                        <Badge tone="green">Visible</Badge>
                      ) : (
                        <Badge tone="slate">Hidden</Badge>
                      )}
                    </TD>
                    <TD>
                      {d.video_url ? (
                        <a
                          href={d.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </TD>
                    <TD className="text-ink/50">
                      {new Date(d.created_at).toLocaleDateString()}
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href={`/dashboard/deliverables/${d.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(d)}
                          disabled={pending}
                        >
                          Delete
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white"
          : "rounded-lg border border-ink/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-ink/20"
      }
    >
      {label}
    </button>
  );
}
