"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { createLeadAction, updateLeadAction, type Lead } from "./actions";
import { LEAD_STATUS_LABEL, LEAD_STATUS_ORDER } from "./status";

type Props =
  | { mode: "create"; lead?: undefined }
  | { mode: "edit"; lead: Lead };

export function LeadForm(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res =
        props.mode === "create"
          ? await createLeadAction(fd)
          : await updateLeadAction(fd);
      if (res && !res.ok) setError(res.error);
      else if (res?.ok) setSaved(true);
    });
  }

  const l = props.mode === "edit" ? props.lead : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={props.mode === "create" ? "New lead" : (l?.name ?? "Leads")}
        subtitle={
          <Link href="/dashboard/leads" className="hover:underline">
            ← Leads
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {props.mode === "create" ? "Create" : "Edit"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {props.mode === "edit" && (
              <input type="hidden" name="id" value={l?.id} />
            )}
            <Field label="Name">
              <Input name="name" required defaultValue={l?.name ?? ""} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact email">
                <Input
                  name="contact_email"
                  type="email"
                  defaultValue={l?.contact_email ?? ""}
                />
              </Field>
              <Field label="Contact phone">
                <Input
                  name="contact_phone"
                  defaultValue={l?.contact_phone ?? ""}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Source">
                <Input name="source" defaultValue={l?.source ?? ""} />
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue={l?.status ?? "new"}>
                  {LEAD_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Estimated value (DT)">
              <Input
                name="value_estimate_dt"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  l?.value_estimate_dt != null ? String(l.value_estimate_dt) : ""
                }
              />
            </Field>
            <Field label="Notes">
              <Textarea name="notes" rows={3} defaultValue={l?.notes ?? ""} />
            </Field>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-600">Saved.</p>}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Saving…"
                  : props.mode === "create"
                    ? "Create"
                    : "Save"}
              </Button>
              <Link
                href={
                  props.mode === "create"
                    ? "/dashboard/leads"
                    : `/dashboard/leads/${l?.id}`
                }
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
