import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DeliverableForm, type ProjectOption } from "../deliverable-form";

export default async function NewDeliverablePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  await requireStaff();
  const { projectId } = await searchParams;
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, clients:client_id(name)")
    .order("created_at", { ascending: false });

  const options: ProjectOption[] = (projects ?? []).map((p) => {
    const c = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    return { id: p.id, name: p.name, client_name: c?.name ?? null };
  });

  return (
    <DeliverableForm
      mode="create"
      projects={options}
      defaultProjectId={projectId}
    />
  );
}
