"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Load a deliverable the current client is allowed to act on, returning the
 * row plus who to notify (its creator/editor) and a label for messages.
 * RLS guarantees the client only ever sees their own visible deliverables.
 */
async function loadOwnedDeliverable(
  deliverableId: string,
): Promise<
  | { ok: true; title: string; createdBy: string | null }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id, title, created_by")
    .eq("id", deliverableId)
    .single();
  if (!data) return { ok: false, error: "Video not found." };
  return { ok: true, title: data.title, createdBy: data.created_by };
}

export async function approveDeliverableAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireClient();
  const id = String(formData.get("deliverable_id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing video." };

  const owned = await loadOwnedDeliverable(id);
  if (!owned.ok) return owned;

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await notify(
    owned.createdBy,
    "deliverable_approved",
    `${session.full_name ?? "The client"} approved "${owned.title}"`,
    "/dashboard/deliverables",
  );

  revalidatePath("/portal/videos");
  revalidatePath("/portal");
  return { ok: true };
}

export async function requestRevisionAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireClient();
  const id = String(formData.get("deliverable_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!id) return { ok: false, error: "Missing video." };
  if (!note) {
    return { ok: false, error: "Please describe what you'd like changed." };
  }

  const owned = await loadOwnedDeliverable(id);
  if (!owned.ok) return owned;

  const supabase = await createClient();
  // Record the note as feedback, then flip the status.
  const { error: fbError } = await supabase
    .from("deliverable_feedback")
    .insert({ deliverable_id: id, author_id: session.id, body: note });
  if (fbError) return { ok: false, error: fbError.message };

  const { error } = await supabase
    .from("deliverables")
    .update({ status: "revision_requested" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await notify(
    owned.createdBy,
    "deliverable_revision",
    `${session.full_name ?? "The client"} requested changes on "${owned.title}"`,
    "/dashboard/deliverables",
  );

  revalidatePath("/portal/videos");
  revalidatePath("/portal");
  return { ok: true };
}

export async function addFeedbackAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireClient();
  const id = String(formData.get("deliverable_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id) return { ok: false, error: "Missing video." };
  if (!body) return { ok: false, error: "Write a message first." };

  const owned = await loadOwnedDeliverable(id);
  if (!owned.ok) return owned;

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverable_feedback")
    .insert({ deliverable_id: id, author_id: session.id, body });
  if (error) return { ok: false, error: error.message };

  await notify(
    owned.createdBy,
    "deliverable_comment",
    `${session.full_name ?? "The client"} commented on "${owned.title}"`,
    "/dashboard/deliverables",
  );

  revalidatePath("/portal/videos");
  return { ok: true };
}
