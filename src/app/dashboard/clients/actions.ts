"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, requireStaff, requireWorkerOrAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

function pickClientFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address: stringOrNull(formData.get("address")),
    matricule_fiscal: stringOrNull(formData.get("matricule_fiscal")),
    email: stringOrNull(formData.get("email")),
    phone: stringOrNull(formData.get("phone")),
    notes: stringOrNull(formData.get("notes")),
  };
}

function stringOrNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

export async function createClientAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireStaff();
  const fields = pickClientFields(formData);
  if (!fields.name) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    // Sales reps own the clients they create (RLS scopes their access by
    // owner_id); admins also stamp themselves as owner by default.
    .insert({ ...fields, created_by: session.id, owner_id: session.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${data.id}`);
}

export async function updateClientAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireWorkerOrAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };

  const fields = pickClientFields(formData);
  if (!fields.name) return { ok: false, error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(fields).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { ok: true };
}

export async function deleteClientAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireWorkerOrAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing ID." };

  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

/**
 * Create a portal LOGIN for a client and link it to the client record.
 * Mirrors createTeamMemberAction: uses the service-role admin client to create
 * an auth user (email confirmed), then inserts a `client`-role profile pointing
 * at the clients row via client_id. A client may have more than one login.
 */
export async function createClientLoginAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireStaff();

  const clientId = String(formData.get("client_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullNameRaw = String(formData.get("full_name") ?? "").trim();
  const fullName = fullNameRaw.length > 0 ? fullNameRaw : null;

  if (!clientId) return { ok: false, error: "Missing client." };
  if (!email || !email.includes("@")) {
    return { ok: false, error: "A valid email is required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, client_id: clientId },
  });
  if (createErr || !created.user) {
    return {
      ok: false,
      error: createErr?.message ?? "Failed to create the login.",
    };
  }

  // Username must be unique; derive from the email local-part and add a short
  // suffix on collision.
  const base = email.split("@")[0].replace(/[^a-z0-9._-]/g, "") || "client";
  let username = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id,
      username,
      full_name: fullName,
      role: "client",
      client_id: clientId,
    });
    if (!profileErr) {
      revalidatePath(`/dashboard/clients/${clientId}`);
      return { ok: true };
    }
    // Unique-violation on username → retry with a suffix; otherwise bail.
    const isUniqueViolation =
      profileErr.code === "23505" ||
      /duplicate|unique/i.test(profileErr.message);
    if (!isUniqueViolation) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { ok: false, error: profileErr.message };
    }
    username = `${base}-${created.user.id.slice(0, 4 + attempt)}`;
  }

  await admin.auth.admin.deleteUser(created.user.id);
  return { ok: false, error: "Could not allocate a unique username." };
}
