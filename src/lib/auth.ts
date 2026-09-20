import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaffRole, type AnyUserRole } from "@/lib/utils";

export type SessionProfile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: AnyUserRole;
  avatar_url: string | null;
  job_title: string | null;
  /** Set only for `client`-role users: the clients row they belong to. */
  client_id: string | null;
};

export async function requireSession(): Promise<SessionProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, avatar_url, job_title, client_id, status")
    .eq("id", user.id)
    .single();

  // Preview builds may be reviewed before the additive accounts migration is
  // applied to the shared database. Keep production fail-closed, while allowing
  // pre-migration visual QA in development/preview only. Suspended users remain
  // blocked by the auth-layer ban in both environments.
  if (
    error?.code === "42703" &&
    (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview")
  ) {
    const legacy = await supabase
      .from("profiles")
      .select("id, username, full_name, role, avatar_url, job_title, client_id")
      .eq("id", user.id)
      .single();
    profile = legacy.data as typeof profile;
    error = legacy.error;
  }

  // Fail closed. An authenticated user whose profile can't be resolved — a
  // missing/orphaned row, a deleted account, or a transient lookup error —
  // must NOT be granted a role. This previously fell back to `editor`, i.e.
  // silent staff access (a privilege escalation). Deny instead: sign the
  // stale session out and bounce to /login. The middleware guard below keeps
  // this from looping straight back into a protected route.
  if (error || !profile) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  // A suspended account is denied here too — no page, staff or client, renders
  // for it. (The account is also banned at the auth layer when suspended.)
  if ((profile as { status?: string }).status === "suspended") {
    await supabase.auth.signOut();
    redirect("/login?suspended=1");
  }

  return {
    id: profile.id,
    email: user.email ?? "",
    username: profile.username,
    full_name: profile.full_name,
    role: profile.role as AnyUserRole,
    avatar_url: profile.avatar_url,
    job_title: profile.job_title ?? null,
    client_id: (profile as { client_id: string | null }).client_id ?? null,
  };
}

export async function requireAdmin(): Promise<SessionProfile> {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}

/** Any team member (admin/editor/sales). Clients are bounced to their portal. */
export async function requireStaff(): Promise<SessionProfile> {
  const session = await requireSession();
  if (!isStaffRole(session.role)) redirect("/portal");
  return session;
}

/** A client-role user. Staff are bounced to the team dashboard. */
export async function requireClient(): Promise<SessionProfile> {
  const session = await requireSession();
  if (session.role !== "client") redirect("/dashboard");
  return session;
}

/**
 * Back-compat shim: this used to mean "not a freelancer". The platform no
 * longer has freelancers, and the equivalent gate now is "is staff", so this
 * delegates to requireStaff() to keep existing call sites working.
 */
export async function requireWorkerOrAdmin(): Promise<SessionProfile> {
  return requireStaff();
}
