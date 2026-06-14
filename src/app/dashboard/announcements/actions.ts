"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type Audience = "all" | "clients" | "team";

const AUDIENCES: readonly Audience[] = ["all", "clients", "team"];

function isAudience(v: string): v is Audience {
  return (AUDIENCES as readonly string[]).includes(v);
}

export async function createAnnouncementAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audienceRaw = String(formData.get("audience") ?? "all").trim();
  const clientIdRaw = String(formData.get("client_id") ?? "").trim();

  if (!title) return { ok: false, error: "Title is required." };
  if (!body) return { ok: false, error: "Body is required." };
  if (!isAudience(audienceRaw)) {
    return { ok: false, error: "Invalid audience." };
  }

  // A targeted client only makes sense when clients are part of the audience.
  const clientId =
    clientIdRaw.length > 0 && audienceRaw !== "team" ? clientIdRaw : null;

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    audience: audienceRaw,
    client_id: clientId,
    created_by: session.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/announcements");
  return { ok: true };
}

export async function deleteAnnouncementAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing ID." };

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/announcements");
  return { ok: true };
}
