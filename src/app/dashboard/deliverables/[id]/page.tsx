import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  DeliverableForm,
  type ProjectOption,
} from "../deliverable-form";
import type { Deliverable } from "../actions";
import { FeedbackThread, type ThreadItem } from "./feedback-thread";

type FeedbackRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  profiles:
    | { full_name: string | null; username: string; role: string }
    | { full_name: string | null; username: string; role: string }[]
    | null;
};

export default async function EditDeliverablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: deliverable }, { data: projects }, { data: feedback }] =
    await Promise.all([
      supabase.from("deliverables").select("*").eq("id", id).single(),
      supabase
        .from("projects")
        .select("id, name, clients:client_id(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("deliverable_feedback")
        .select(
          "id, body, created_at, author_id, profiles:author_id(full_name, username, role)",
        )
        .eq("deliverable_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!deliverable) notFound();

  const options: ProjectOption[] = (projects ?? []).map((p) => {
    const c = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    return { id: p.id, name: p.name, client_name: c?.name ?? null };
  });

  const thread: ThreadItem[] = ((feedback ?? []) as FeedbackRow[]).map((f) => {
    const prof = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
    return {
      id: f.id,
      body: f.body,
      created_at: f.created_at,
      author_name: prof?.full_name ?? (prof?.username ? `@${prof.username}` : "—"),
      is_client: prof?.role === "client",
    };
  });

  return (
    <div className="space-y-6">
      <DeliverableForm
        mode="edit"
        projects={options}
        deliverable={deliverable as Deliverable}
      />
      <FeedbackThread deliverableId={id} items={thread} />
    </div>
  );
}
