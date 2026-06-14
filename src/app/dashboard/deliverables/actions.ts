"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DeliverableStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "delivered"
  | "revision_requested";

const STATUSES: DeliverableStatus[] = [
  "draft",
  "in_review",
  "approved",
  "delivered",
  "revision_requested",
];

export type Deliverable = {
  id: string;
  project_id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: DeliverableStatus;
  client_visible: boolean;
  delivered_at: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function stringOrNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function normalizeStatus(v: FormDataEntryValue | null): DeliverableStatus {
  const s = String(v ?? "").trim();
  return STATUSES.includes(s as DeliverableStatus)
    ? (s as DeliverableStatus)
    : "draft";
}

function pickDeliverableFields(formData: FormData) {
  const status = normalizeStatus(formData.get("status"));
  return {
    project_id: String(formData.get("project_id") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    video_url: stringOrNull(formData.get("video_url")),
    thumbnail_url: stringOrNull(formData.get("thumbnail_url")),
    status,
    client_visible: formData.get("client_visible") != null,
    delivered_at: status === "delivered" ? new Date().toISOString() : null,
  };
}

export async function createDeliverableAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();
  const fields = pickDeliverableFields(formData);
  if (!fields.title) return { ok: false, error: "Title is required." };
  if (!fields.project_id) return { ok: false, error: "Project is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .insert({ ...fields, created_by: session.id });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/deliverables");
  revalidatePath(`/dashboard/projects/${fields.project_id}`);

  // Quick-add from the project page should stay on the project page.
  if (formData.get("stay") != null) return { ok: true };
  redirect("/dashboard/deliverables");
}

export async function updateDeliverableAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };

  const fields = pickDeliverableFields(formData);
  if (!fields.title) return { ok: false, error: "Title is required." };
  if (!fields.project_id) return { ok: false, error: "Project is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .update(fields)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/deliverables");
  revalidatePath(`/dashboard/projects/${fields.project_id}`);
  return { ok: true };
}

export async function deleteDeliverableAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };
  const projectId = String(formData.get("project_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/deliverables");
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);

  if (formData.get("stay") != null) return { ok: true };
  redirect("/dashboard/deliverables");
}

export async function toggleDeliverableVisibilityAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };
  const next = String(formData.get("client_visible") ?? "") === "true";
  const projectId = String(formData.get("project_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .update({ client_visible: next })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/deliverables");
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true };
}

export async function setDeliverableStatusAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };
  const status = normalizeStatus(formData.get("status"));
  const projectId = String(formData.get("project_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .update({
      status,
      delivered_at: status === "delivered" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/deliverables");
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
  return { ok: true };
}
