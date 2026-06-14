import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FilesView, type AssetRow, type ClientOption, type ProjectOption } from "./files-view";

// Defensive helper so one failing query can't take down the whole page.
async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[files:${label}]`, err);
    return fallback;
  }
}

type RawAsset = {
  id: string;
  name: string;
  url: string;
  kind: string | null;
  client_visible: boolean | null;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
  clients: { name: string } | { name: string }[] | null;
  projects: { name: string } | { name: string }[] | null;
};

export default async function FilesPage() {
  await requireStaff();
  const supabase = await createClient();

  const assets: AssetRow[] = await safe(
    async () => {
      const { data } = await supabase
        .from("assets")
        .select("*, clients(name), projects(name)")
        .order("created_at", { ascending: false });
      return (data ?? []).map((raw) => {
        const r = raw as RawAsset;
        const c = Array.isArray(r.clients) ? r.clients[0] : r.clients;
        const p = Array.isArray(r.projects) ? r.projects[0] : r.projects;
        return {
          id: r.id,
          name: r.name,
          url: r.url,
          kind: r.kind ?? "other",
          client_visible: r.client_visible ?? false,
          client_id: r.client_id,
          project_id: r.project_id,
          created_at: r.created_at,
          client_name: c?.name ?? null,
          project_name: p?.name ?? null,
        } satisfies AssetRow;
      });
    },
    [] as AssetRow[],
    "assets",
  );

  const clients: ClientOption[] = await safe(
    async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .order("name", { ascending: true });
      return (data ?? []) as ClientOption[];
    },
    [] as ClientOption[],
    "clients",
  );

  const projects: ProjectOption[] = await safe(
    async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, client_id")
        .order("name", { ascending: true });
      return (data ?? []) as ProjectOption[];
    },
    [] as ProjectOption[],
    "projects",
  );

  return <FilesView assets={assets} clients={clients} projects={projects} />;
}
