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

  const [{ data: profiles }, { data: usersData }, { data: clients }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, username, full_name, role, status, client_id, job_title"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("clients").select("id, name").order("name"),
    ]);

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

  const { data: audit } = await admin
    .from("account_audit_events")
    .select("id, actor_id, target_user_id, action, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

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
