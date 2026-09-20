"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD, EmptyState } from "@/components/ui/table";

type Status = "active" | "on_hold" | "completed" | "cancelled";

const statusTone: Record<Status, "blue" | "amber" | "green" | "slate"> = {
  active: "blue",
  on_hold: "amber",
  completed: "green",
  cancelled: "slate",
};

export type ProjectRow = {
  id: string;
  name: string;
  status: Status;
  end_date: string | null;
  owner: string;
  tasks_count: number;
  client?: { id: string; name: string };
};

export function ProjectsTable({
  projects,
  showClient,
}: {
  projects: ProjectRow[];
  showClient?: boolean;
}) {
  const { t } = useI18n();

  if (projects.length === 0) {
    return <EmptyState>{t.projects.empty}</EmptyState>;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {projects.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="block rounded-2xl border border-white/10 bg-ink-2 p-4 transition-colors hover:border-brand/40">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-sm font-semibold text-white">{p.name}</h2>
              <Badge tone={statusTone[p.status]}>{t.projects.status[p.status]}</Badge>
            </div>
            {showClient && <p className="mt-2 truncate text-xs text-white/55">{p.client?.name ?? "No client linked"}</p>}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs text-white/55">
              <span>{p.tasks_count} {p.tasks_count === 1 ? "task" : "tasks"}</span>
              {p.owner !== "—" && <span>{p.owner}</span>}
              {p.end_date && <span className="ml-auto">Due {new Date(p.end_date).toLocaleDateString()}</span>}
            </div>
          </Link>
        ))}
      </div>
      <div className="hidden md:block">
      <Table>
      <THead>
        <TR>
          <TH>{t.projects.columns.name}</TH>
          {showClient && <TH>Client</TH>}
          <TH>{t.projects.columns.status}</TH>
          <TH>{t.projects.columns.owner}</TH>
          <TH>{t.projects.columns.deadline}</TH>
          <TH>{t.projects.columns.tasks}</TH>
        </TR>
      </THead>
      <TBody>
        {projects.map((p) => (
          <TR key={p.id}>
            <TD className="font-medium text-ink">
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="hover:text-brand"
              >
                {p.name}
              </Link>
            </TD>
            {showClient && (
              <TD className="text-ink/65">
                {p.client ? (
                  <Link
                    href={`/dashboard/clients/${p.client.id}`}
                    className="hover:text-brand"
                  >
                    {p.client.name}
                  </Link>
                ) : (
                  "—"
                )}
              </TD>
            )}
            <TD>
              <Badge tone={statusTone[p.status]}>
                {t.projects.status[p.status]}
              </Badge>
            </TD>
            <TD className="text-ink/65">{p.owner}</TD>
            <TD className="text-ink/65">
              {p.end_date
                ? new Date(p.end_date).toLocaleDateString()
                : "—"}
            </TD>
            <TD className="text-ink/65">{p.tasks_count}</TD>
          </TR>
        ))}
      </TBody>
      </Table>
      </div>
    </>
  );
}
