import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  DeliverableForm,
  type ProjectOption,
} from "../deliverable-form";
import type { Deliverable } from "../actions";

export default async function EditDeliverablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: deliverable }, { data: projects }] = await Promise.all([
    supabase.from("deliverables").select("*").eq("id", id).single(),
    supabase
      .from("projects")
      .select("id, name, clients:client_id(name)")
      .order("created_at", { ascending: false }),
  ]);

  if (!deliverable) notFound();

  const options: ProjectOption[] = (projects ?? []).map((p) => {
    const c = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    return { id: p.id, name: p.name, client_name: c?.name ?? null };
  });

  return (
    <DeliverableForm
      mode="edit"
      projects={options}
      deliverable={deliverable as Deliverable}
    />
  );
}
