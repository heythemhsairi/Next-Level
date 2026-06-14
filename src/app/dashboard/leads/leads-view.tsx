"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  convertLeadToClientAction,
  setLeadStatusAction,
  type Lead,
  type LeadStatus,
} from "./actions";
import {
  formatLeadValue,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDER,
  LEAD_STATUS_TONE,
} from "./status";

export function LeadsView({ leads }: { leads: Lead[] }) {
  const grouped = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      won: [],
      lost: [],
    };
    for (const lead of leads) map[lead.status].push(lead);
    return map;
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Track and convert your sales pipeline."
        action={
          <Link href="/dashboard/leads/new">
            <Button>Add lead</Button>
          </Link>
        }
      />

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/12 bg-white/70 px-6 py-16 text-center">
          <p className="text-sm text-ink/55">No leads yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
          {LEAD_STATUS_ORDER.map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Badge tone={LEAD_STATUS_TONE[status]} dot>
                  {LEAD_STATUS_LABEL[status]}
                </Badge>
                <span className="text-xs font-medium text-ink/45">
                  {grouped[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[status].length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink/10 bg-white/40 px-3 py-6 text-center text-xs text-ink/40">
                    Empty
                  </p>
                ) : (
                  grouped[status].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition();

  function onStatusChange(status: string) {
    const fd = new FormData();
    fd.set("id", lead.id);
    fd.set("status", status);
    startTransition(async () => {
      await setLeadStatusAction(fd);
    });
  }

  function onConvert() {
    if (
      !confirm(
        `Convert "${lead.name}" to a client? This will create a new client and mark the lead as won.`,
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", lead.id);
    startTransition(async () => {
      await convertLeadToClientAction(fd);
    });
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft">
      <Link
        href={`/dashboard/leads/${lead.id}`}
        className="block text-sm font-semibold text-ink hover:text-brand"
      >
        {lead.name}
      </Link>

      <p className="mt-1 text-sm font-medium text-ink/80">
        {formatLeadValue(lead.value_estimate_dt)}
      </p>

      <div className="mt-2 space-y-0.5 text-xs text-ink/55">
        {lead.source && <p>Source: {lead.source}</p>}
        {lead.contact_email && <p>{lead.contact_email}</p>}
        {lead.contact_phone && <p>{lead.contact_phone}</p>}
      </div>

      <div className="mt-3 space-y-2">
        <Select
          value={lead.status}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={pending}
          className="h-8 text-xs"
        >
          {LEAD_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>

        {lead.converted_client_id ? (
          <Link
            href={`/dashboard/clients/${lead.converted_client_id}`}
            className="block"
          >
            <Button variant="outline" size="sm" className="w-full">
              View client
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onConvert}
            disabled={pending}
          >
            {pending ? "Working…" : "Convert to client"}
          </Button>
        )}
      </div>
    </div>
  );
}
