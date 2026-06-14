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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, avatar_url, job_title, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? "",
      username: user.email?.split("@")[0] ?? "user",
      full_name: null,
      role: "editor",
      avatar_url: null,
      job_title: null,
      client_id: null,
    };
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
