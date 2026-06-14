"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

export type Lead = {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  source: string | null;
  status: LeadStatus;
  value_estimate_dt: number | null;
  notes: string | null;
  owner_id: string | null;
  converted_client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

function stringOrNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function numberOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (s.length === 0) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseStatus(v: FormDataEntryValue | null): LeadStatus {
  const s = String(v ?? "").trim();
  return (LEAD_STATUSES as readonly string[]).includes(s)
    ? (s as LeadStatus)
    : "new";
}

function pickLeadFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    contact_email: stringOrNull(formData.get("contact_email")),
    contact_phone: stringOrNull(formData.get("contact_phone")),
    source: stringOrNull(formData.get("source")),
    status: parseStatus(formData.get("status")),
    value_estimate_dt: numberOrNull(formData.get("value_estimate_dt")),
    notes: stringOrNull(formData.get("notes")),
  };
}

export async function createLeadAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();
  const fields = pickLeadFields(formData);
  if (!fields.name) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...fields, owner_id: session.id, created_by: session.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/leads");
  redirect(`/dashboard/leads/${data.id}`);
}

export async function updateLeadAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };

  const fields = pickLeadFields(formData);
  if (!fields.name) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(fields).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${id}`);
  return { ok: true };
}

export async function deleteLeadAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

export async function setLeadStatusAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };
  const status = parseStatus(formData.get("status"));

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${id}`);
  return { ok: true };
}

export async function convertLeadToClientAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };

  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, contact_email, contact_phone, converted_client_id")
    .eq("id", id)
    .single();
  if (leadError) return { ok: false, error: leadError.message };
  if (!lead) return { ok: false, error: "Lead not found." };
  if (lead.converted_client_id) {
    return { ok: false, error: "This lead has already been converted." };
  }

  const { data: newClient, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: lead.name,
      email: lead.contact_email,
      phone: lead.contact_phone,
      created_by: session.id,
      owner_id: session.id,
    })
    .select("id")
    .single();
  if (clientError) return { ok: false, error: clientError.message };

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "won", converted_client_id: newClient.id })
    .eq("id", id);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${newClient.id}`);
}
