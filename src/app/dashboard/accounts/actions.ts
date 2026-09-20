"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountActionResult =
  | { ok: true; link?: string; message?: string }
  | { ok: false; error: string };

// Ban far into the future = effectively suspended at the auth layer, on top of
// the profiles.status flag the app's session guard checks.
const SUSPEND_BAN = "876000h"; // ~100 years

async function logAudit(
  admin: SupabaseClient,
  actorId: string,
  targetUserId: string | null,
  action: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  try {
    await admin.from("account_audit_events").insert({
      actor_id: actorId,
      target_user_id: targetUserId,
      action,
      detail,
    });
  } catch {
    // Audit is best-effort; never block the primary action on a log failure.
  }
}

/** Invite a NEW client-portal login: creates the user, links it to a client,
 *  and returns a set-password link the admin shares — no plaintext password. */
export async function inviteClientAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const session = await requireAdmin();

  const clientId = String(formData.get("client_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullNameRaw = String(formData.get("full_name") ?? "").trim();
  const fullName = fullNameRaw.length > 0 ? fullNameRaw : null;

  if (!clientId) return { ok: false, error: "Choose a client to link." };
  if (!email || !email.includes("@")) {
    return { ok: false, error: "A valid email is required." };
  }

  const admin = createAdminClient();

  // Random throwaway password; the user sets their own via the recovery link.
  const tempPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, client_id: clientId },
  });
  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? "Failed to create account." };
  }

  const base = email.split("@")[0].replace(/[^a-z0-9._-]/g, "") || "client";
  let username = base;
  let profileInserted = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id,
      username,
      full_name: fullName,
      role: "client",
      client_id: clientId,
      status: "active",
    });
    if (!profileErr) {
      profileInserted = true;
      break;
    }
    const isUnique =
      profileErr.code === "23505" || /duplicate|unique/i.test(profileErr.message);
    if (!isUnique) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { ok: false, error: profileErr.message };
    }
    username = `${base}-${created.user.id.slice(0, 4 + attempt)}`;
  }
  if (!profileInserted) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: "Could not allocate a unique username." };
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  const link = linkData?.properties?.action_link;

  await logAudit(admin, session.id, created.user.id, "invite", {
    email,
    client_id: clientId,
  });
  revalidatePath("/dashboard/accounts");
  return {
    ok: true,
    link,
    message: link
      ? "Account created. Share this set-password link with the client."
      : `Account created, but no link could be generated${
          linkErr ? ` (${linkErr.message})` : ""
        } — use Reset access to try again.`,
  };
}

/** Generate a fresh set-password / recovery link for an existing account. */
export async function resetAccessAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, error: "Missing account email." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit(admin, session.id, userId || null, "reset", { email });
  return {
    ok: true,
    link: data?.properties?.action_link,
    message: "Share this link so they can set a new password.",
  };
}

export async function suspendAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { ok: false, error: "Missing account." };
  if (userId === session.id) {
    return { ok: false, error: "You can't suspend your own account." };
  }

  const admin = createAdminClient();
  const { error: profErr } = await admin
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);
  if (profErr) return { ok: false, error: profErr.message };

  const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: SUSPEND_BAN,
  });
  if (banErr) {
    // Roll back the profile flag so we never leave a half-suspended account
    // (blocked at the app layer but still able to hold a live auth session).
    await admin.from("profiles").update({ status: "active" }).eq("id", userId);
    return {
      ok: false,
      error: `Couldn't suspend at the auth layer: ${banErr.message}`,
    };
  }

  await logAudit(admin, session.id, userId, "suspend");
  revalidatePath("/dashboard/accounts");
  return { ok: true, message: "Account suspended." };
}

export async function reactivateAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { ok: false, error: "Missing account." };

  const admin = createAdminClient();
  const { error: profErr } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);
  if (profErr) return { ok: false, error: profErr.message };

  const { error: unbanErr } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (unbanErr) {
    // Roll back so the account isn't marked active while still auth-banned.
    await admin.from("profiles").update({ status: "suspended" }).eq("id", userId);
    return {
      ok: false,
      error: `Couldn't lift the auth ban: ${unbanErr.message}`,
    };
  }

  await logAudit(admin, session.id, userId, "reactivate");
  revalidatePath("/dashboard/accounts");
  return { ok: true, message: "Account reactivated." };
}

/** Edit display name (and, for client accounts, the linked client). */
export async function editAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  const fullNameRaw = String(formData.get("full_name") ?? "").trim();
  const clientId = String(formData.get("client_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!userId) return { ok: false, error: "Missing account." };

  const patch: Record<string, unknown> = {
    full_name: fullNameRaw.length > 0 ? fullNameRaw : null,
  };
  if (clientId) patch.client_id = clientId;

  const admin = createAdminClient();

  // Email lives in auth.users, not profiles — update it there when changed.
  if (email) {
    if (!email.includes("@")) {
      return { ok: false, error: "Enter a valid email address." };
    }
    const { error: emailErr } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (emailErr) {
      return { ok: false, error: `Couldn't update email: ${emailErr.message}` };
    }
  }

  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await logAudit(admin, session.id, userId, "edit", {
    ...patch,
    ...(email ? { email } : {}),
  });
  revalidatePath("/dashboard/accounts");
  return { ok: true, message: "Account updated." };
}
