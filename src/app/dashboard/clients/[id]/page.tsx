import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDetailActions } from "./detail-actions";
import { PortalAccessCard, type ClientLogin } from "./portal-access-card";
import { ProjectsTable } from "../../projects/projects-table";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, name, address, matricule_fiscal, email, phone, notes, created_at",
    )
    .eq("id", id)
    .single();
  if (!client) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, status, end_date, owner_id, profiles:owner_id(username, full_name), tasks(count)",
    )
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  // Existing portal logins linked to this client.
  const { data: logins } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("client_id", id)
    .eq("role", "client");

  return (
    <div className="space-y-8">
      <PageHeader
        title={client.name}
        subtitle={
          <Link href="/dashboard/clients" className="hover:underline">
            ← Clients
          </Link>
        }
        action={
          <ClientDetailActions
            clientId={client.id}
            isAdmin={session.role === "admin"}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Address" value={client.address} />
              <Info label="Tax ID" value={client.matricule_fiscal} />
              <Info label="Email" value={client.email} />
              <Info label="Phone" value={client.phone} />
              <Info label="Notes" value={client.notes} multiline />
            </CardContent>
          </Card>

          <PortalAccessCard
            clientId={client.id}
            clientEmail={client.email}
            logins={(logins ?? []) as ClientLogin[]}
          />
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Projects</h2>
            <Link href={`/dashboard/projects/new?clientId=${client.id}`}>
              <Button size="sm">+ New project</Button>
            </Link>
          </div>
          <ProjectsTable
            projects={(projects ?? []).map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              end_date: p.end_date,
              owner: profileLabel(p.profiles),
              tasks_count:
                Array.isArray(p.tasks) && p.tasks[0] ? p.tasks[0].count : 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

type Profile = { username: string; full_name: string | null } | null;

function profileLabel(p: Profile | Profile[] | undefined): string {
  const profile = Array.isArray(p) ? p[0] : p;
  if (!profile) return "—";
  return profile.full_name ?? `@${profile.username}`;
}

function Info({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p
        className={
          multiline
            ? "mt-0.5 whitespace-pre-wrap text-ink/85"
            : "mt-0.5 text-ink/85"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
