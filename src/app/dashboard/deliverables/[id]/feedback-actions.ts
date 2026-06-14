"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addStaffFeedbackAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();
  const id = String(formData.get("deliverable_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id) return { ok: false, error: "Missing video." };
  if (!body) return { ok: false, error: "Write a message first." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverable_feedback")
    .insert({ deliverable_id: id, author_id: session.id, body });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/deliverables/${id}`);
  return { ok: true };
}
