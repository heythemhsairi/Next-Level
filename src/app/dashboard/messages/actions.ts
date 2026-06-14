"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendMessageAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();

  const clientId = String(formData.get("client_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!clientId) return { ok: false, error: "Missing client." };
  if (!body) return { ok: false, error: "Message cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    client_id: clientId,
    author_id: session.id,
    body,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/messages");
  revalidatePath(`/dashboard/messages/${clientId}`);
  return { ok: true };
}
