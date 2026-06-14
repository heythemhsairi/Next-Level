import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadDetailActions } from "./detail-actions";
import type { Lead } from "../actions";
import {
  formatLeadValue,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
} from "../status";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();
  const lead = data as Lead;

  return (
    <div className="space-y-8">
      <PageHeader
        title={lead.name}
        subtitle={
          <Link href="/dashboard/leads" className="hover:underline">
            ← Leads
          </Link>
        }
        action={
          <LeadDetailActions
            leadId={lead.id}
            leadName={lead.name}
            isAdmin={session.role === "admin"}
            convertedClientId={lead.converted_client_id}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Status
              </p>
              <p className="mt-1">
                <Badge tone={LEAD_STATUS_TONE[lead.status]} dot>
                  {LEAD_STATUS_LABEL[lead.status]}
                </Badge>
              </p>
            </div>
            <Info
              label="Estimated value"
              value={formatLeadValue(lead.value_estimate_dt)}
            />
            <Info label="Source" value={lead.source} />
            <Info label="Contact email" value={lead.contact_email} />
            <Info label="Contact phone" value={lead.contact_phone} />
            <Info label="Notes" value={lead.notes} multiline />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {lead.converted_client_id ? (
              <p className="text-ink/70">
                This lead has been converted to a{" "}
                <Link
                  href={`/dashboard/clients/${lead.converted_client_id}`}
                  className="font-medium text-brand hover:underline"
                >
                  client
                </Link>
                .
              </p>
            ) : (
              <p className="text-ink/55">
                This lead has not been converted yet. Use “Convert to client”
                to create a client from this lead.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
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
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={
          multiline
            ? "mt-0.5 whitespace-pre-wrap text-slate-800"
            : "mt-0.5 text-slate-800"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
