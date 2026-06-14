"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendClientMessageAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireClient();

  if (!session.client_id) {
    return { ok: false, error: "Your account is not linked to a client." };
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Write a message first." };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    client_id: session.client_id,
    author_id: session.id,
    body,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/messages");
  return { ok: true };
}
