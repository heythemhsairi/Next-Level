"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type AssetKind = "brief" | "footage" | "brand" | "other";

const ASSET_KINDS: readonly AssetKind[] = ["brief", "footage", "brand", "other"];

function stringOrNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function parseKind(v: FormDataEntryValue | null): AssetKind {
  const s = String(v ?? "").trim();
  return (ASSET_KINDS as readonly string[]).includes(s)
    ? (s as AssetKind)
    : "other";
}

export async function createAssetAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };
  if (!url) return { ok: false, error: "URL is required." };

  const fields = {
    name,
    url,
    kind: parseKind(formData.get("kind")),
    client_id: stringOrNull(formData.get("client_id")),
    project_id: stringOrNull(formData.get("project_id")),
    // Checkboxes only appear in FormData when checked.
    client_visible: formData.get("client_visible") != null,
    created_by: session.id,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("assets").insert(fields);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/files");
  return { ok: true };
}

export async function deleteAssetAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing ID." };

  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/files");
  return { ok: true };
}
