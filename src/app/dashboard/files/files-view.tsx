"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { createAssetAction, deleteAssetAction, type AssetKind } from "./actions";

export type AssetRow = {
  id: string;
  name: string;
  url: string;
  kind: string;
  client_visible: boolean;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
  client_name: string | null;
  project_name: string | null;
};

export type ClientOption = { id: string; name: string };
export type ProjectOption = { id: string; name: string; client_id: string | null };

const KIND_OPTIONS: { value: AssetKind; label: string }[] = [
  { value: "brief", label: "Brief" },
  { value: "footage", label: "Footage" },
  { value: "brand", label: "Brand" },
  { value: "other", label: "Other" },
];

type BadgeTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "slate"
  | "accent"
  | "ink";

const KIND_TONE: Record<string, BadgeTone> = {
  brief: "blue",
  footage: "violet",
  brand: "accent",
  other: "slate",
};

function kindLabel(kind: string): string {
  const found = KIND_OPTIONS.find((k) => k.value === kind);
  return found ? found.label : kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function FilesView({
  assets,
  clients,
  projects,
}: {
  assets: AssetRow[];
  clients: ClientOption[];
  projects: ProjectOption[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");

  // Only show projects belonging to the chosen client (or all when none chosen).
  const projectOptions = useMemo(() => {
    if (!selectedClient) return projects;
    return projects.filter((p) => p.client_id === selectedClient);
  }, [projects, selectedClient]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (kindFilter !== "all" && a.kind !== kindFilter) return false;
      if (q.length > 0) {
        const hay = `${a.name} ${a.client_name ?? ""} ${a.project_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [assets, search, kindFilter]);

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createAssetAction(fd);
      if (res && !res.ok) setError(res.error);
      else {
        form.reset();
        setSelectedClient("");
      }
    });
  }

  function onDelete(id: string) {
    setError(null);
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await deleteAssetAction(fd);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files & assets"
        subtitle="Library"
        description="Briefs, footage and brand assets shared across clients and projects."
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card variant="ink">
        <CardHeader>
          <CardTitle>Add file</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onCreate}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input name="name" required placeholder="Asset name" />
              </Field>
              <Field label="URL">
                <Input name="url" required type="url" placeholder="https://…" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Kind">
                <Select name="kind" defaultValue="other">
                  {KIND_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Client">
                <Select
                  name="client_id"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">— None —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Project (optional)">
                <Select name="project_id" defaultValue="">
                  <option value="">— None —</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink/75">
              <input
                type="checkbox"
                name="client_visible"
                defaultChecked
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-brand focus:ring-brand/30"
              />
              Visible to the client
            </label>
            <div className="pt-1">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Add file"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="glass-dark flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 md:px-5">
        <div className="min-w-[220px] flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
          />
        </div>
        <Select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All kinds</option>
          {KIND_OPTIONS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
        <span className="ml-auto rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-ink/65">
          {filtered.length} file{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center text-sm text-ink/55">
          No files yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink" title={a.name}>
                    {a.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink/55">
                    {a.client_name ?? "No client"}
                    {a.project_name ? ` · ${a.project_name}` : ""}
                  </p>
                </div>
                <Badge tone={KIND_TONE[a.kind] ?? "slate"}>{kindLabel(a.kind)}</Badge>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                {a.client_visible ? (
                  <Badge tone="green" dot>
                    Client visible
                  </Badge>
                ) : (
                  <Badge tone="slate" dot>
                    Internal
                  </Badge>
                )}
                <span className="text-ink/40">
                  {new Date(a.created_at).toLocaleDateString("en-US")}
                </span>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-1">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-white/15 px-3 text-sm text-ink/80 transition-colors hover:border-brand hover:text-ink"
                >
                  Open
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onDelete(a.id)}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-ink/75">{label}</label>
      {children}
    </div>
  );
}
