"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountActionResult =
  | { ok: true; link?: string; message?: string; warning?: string }
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
): Promise<boolean> {
  try {
    const { error } = await admin.from("account_audit_events").insert({
      actor_id: actorId,
      target_user_id: targetUserId,
      action,
      detail,
    });
    if (error) {
      console.error(`[accounts:audit:${action}]`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[accounts:audit:${action}]`, error);
    return false;
  }
}

const AUDIT_WARNING = "The account changed, but its audit entry was not saved. Contact an administrator.";

async function recoveryLink(tokenHash: string): Promise<string> {
  let origin: string;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    origin = `https://${process.env.VERCEL_URL}`;
  } else {
    const host = (await headers()).get("host") ?? "";
    origin = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
      ? `http://localhost${host.includes(":") ? host.slice(host.indexOf(":")) : ""}`
      : "https://nextlevelportal.vercel.app";
  }
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "recovery");
  return url.toString();
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
  const tokenHash = linkData?.properties?.hashed_token;
  const link = tokenHash ? await recoveryLink(tokenHash) : undefined;

  const auditOk = await logAudit(admin, session.id, created.user.id, "invite", {
    email,
    client_id: clientId,
  });
  revalidatePath("/dashboard/accounts");
  return {
    ok: true,
    link,
    warning: auditOk ? undefined : AUDIT_WARNING,
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
  if (!userId) return { ok: false, error: "Missing account." };

  const admin = createAdminClient();
  const { data: account, error: lookupErr } = await admin.auth.admin.getUserById(userId);
  const email = account.user?.email;
  if (lookupErr || !email) return { ok: false, error: "Account email could not be verified." };
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) return { ok: false, error: error.message };

  const auditOk = await logAudit(admin, session.id, userId, "reset", { email });
  const tokenHash = data?.properties?.hashed_token;
  return {
    ok: true,
    link: tokenHash ? await recoveryLink(tokenHash) : undefined,
    message: "Share this link so they can set a new password.",
    warning: auditOk ? undefined : AUDIT_WARNING,
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
  const { data: before, error: lookupErr } = await admin.from("profiles").select("status").eq("id", userId).single();
  if (lookupErr || !before) return { ok: false, error: "Account could not be found." };
  if (before.status === "suspended") return { ok: true, message: "Account is already suspended." };
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
    const { error: rollbackErr } = await admin.from("profiles").update({ status: before.status }).eq("id", userId);
    return {
      ok: false,
      error: rollbackErr
        ? `Auth suspension failed and profile rollback failed. Account access needs manual review: ${rollbackErr.message}`
        : `Couldn't suspend at the auth layer: ${banErr.message}`,
    };
  }

  const auditOk = await logAudit(admin, session.id, userId, "suspend");
  revalidatePath("/dashboard/accounts");
  return { ok: true, message: "Account suspended.", warning: auditOk ? undefined : AUDIT_WARNING };
}

export async function reactivateAccountAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return { ok: false, error: "Missing account." };

  const admin = createAdminClient();
  const { data: before, error: lookupErr } = await admin.from("profiles").select("status").eq("id", userId).single();
  if (lookupErr || !before) return { ok: false, error: "Account could not be found." };
  if (before.status === "active") return { ok: true, message: "Account is already active." };
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
    const { error: rollbackErr } = await admin.from("profiles").update({ status: before.status }).eq("id", userId);
    return {
      ok: false,
      error: rollbackErr
        ? `Auth reactivation failed and profile rollback failed. Account access needs manual review: ${rollbackErr.message}`
        : `Couldn't lift the auth ban: ${unbanErr.message}`,
    };
  }

  const auditOk = await logAudit(admin, session.id, userId, "reactivate");
  revalidatePath("/dashboard/accounts");
  return { ok: true, message: "Account reactivated.", warning: auditOk ? undefined : AUDIT_WARNING };
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
  const { data: profile, error: profileErr } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (profileErr || !profile) return { ok: false, error: "Account profile could not be found." };
  if (clientId && profile.role !== "client") return { ok: false, error: "Only client logins can be linked to clients." };

  let previousEmail: string | null = null;
  let emailChanged = false;

  // Email lives in auth.users, not profiles — update it there when changed.
  if (email) {
    if (profile.role !== "client") return { ok: false, error: "Staff sign-in email is managed separately." };
    if (!email.includes("@")) {
      return { ok: false, error: "Enter a valid email address." };
    }
    const { data: account, error: lookupErr } = await admin.auth.admin.getUserById(userId);
    if (lookupErr || !account.user?.email) return { ok: false, error: "Current account email could not be verified." };
    previousEmail = account.user.email;
    if (email !== previousEmail.toLowerCase()) {
      const { error: emailErr } = await admin.auth.admin.updateUserById(userId, {
        email,
        email_confirm: true,
      });
      if (emailErr) return { ok: false, error: `Couldn't update email: ${emailErr.message}` };
      emailChanged = true;
    }
  }

  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) {
    if (emailChanged && previousEmail) {
      const { error: rollbackErr } = await admin.auth.admin.updateUserById(userId, { email: previousEmail, email_confirm: true });
      if (rollbackErr) return { ok: false, error: `Profile update failed and email rollback failed. Review this account manually: ${rollbackErr.message}` };
    }
    return { ok: false, error: error.message };
  }

  const auditOk = await logAudit(admin, session.id, userId, "edit", {
    ...patch,
    ...(email ? { email } : {}),
  });
  revalidatePath("/dashboard/accounts");
  return { ok: true, message: "Account updated.", warning: auditOk ? undefined : AUDIT_WARNING };
}
