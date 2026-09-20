import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AccountsView,
  type AccountRow,
  type ClientOption,
  type AuditRow,
} from "./accounts-view";

// Reads live auth + profile data through the service role; never cache.
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [profileResult, usersResult, clientsResult] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, username, full_name, role, status, client_id, job_title"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("clients").select("id, name").order("name"),
    ]);

  if (profileResult.error?.code === "42703") {
    return (
      <section className="rounded-2xl border border-white/10 bg-ink-2 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-light">Portal Accounts</p>
        <h1 className="mt-3 text-2xl font-display font-bold text-white">Account management is being prepared</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
          The account data is not ready in this environment yet. Please complete the database setup before inviting or changing logins.
        </p>
      </section>
    );
  }
  if (profileResult.error || usersResult.error || clientsResult.error) {
    throw new Error("Portal accounts could not be loaded.");
  }

  const profiles = profileResult.data;
  const usersData = usersResult.data;
  const clients = clientsResult.data;

  const authById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u] as const),
  );
  const clientNameById = new Map(
    (clients ?? []).map((c) => [c.id, c.name] as const),
  );

  const accounts: AccountRow[] = (profiles ?? [])
    .map((p): AccountRow => {
      const u = authById.get(p.id);
      return {
        id: p.id,
        username: p.username,
        fullName: p.full_name ?? null,
        role: p.role,
        status: (p.status as string) ?? "active",
        email: u?.email ?? null,
        lastSignInAt: u?.last_sign_in_at ?? null,
        clientId: p.client_id ?? null,
        clientName: p.client_id
          ? clientNameById.get(p.client_id) ?? null
          : null,
      };
    })
    .sort((a, b) => a.username.localeCompare(b.username));

  const { data: audit, error: auditError } = await admin
    .from("account_audit_events")
    .select("id, actor_id, target_user_id, action, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (auditError) throw new Error("Account activity could not be loaded.");

  const labelById = new Map(
    (profiles ?? []).map(
      (p) => [p.id, p.full_name || p.username] as const,
    ),
  );
  const auditRows: AuditRow[] = (audit ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    actor: a.actor_id ? labelById.get(a.actor_id) ?? "—" : "system",
    target: a.target_user_id ? labelById.get(a.target_user_id) ?? "—" : "—",
    createdAt: a.created_at,
  }));

  const clientOptions: ClientOption[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <AccountsView
      accounts={accounts}
      clients={clientOptions}
      audit={auditRows}
    />
  );
}
