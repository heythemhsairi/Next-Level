import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DeliverablesView, type DeliverableRow } from "./deliverables-view";

export default async function DeliverablesPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("*, projects(name, clients(name))")
    .order("created_at", { ascending: false });

  const rows: DeliverableRow[] = (data ?? []).map((d) => {
    const project = Array.isArray(d.projects) ? d.projects[0] : d.projects;
    const client = project
      ? Array.isArray(project.clients)
        ? project.clients[0]
        : project.clients
      : null;
    return {
      id: d.id,
      project_id: d.project_id,
      title: d.title,
      video_url: d.video_url,
      thumbnail_url: d.thumbnail_url,
      status: d.status,
      client_visible: d.client_visible,
      delivered_at: d.delivered_at,
      created_at: d.created_at,
      project_name: project?.name ?? null,
      client_name: client?.name ?? null,
    };
  });

  return <DeliverablesView deliverables={rows} />;
}
