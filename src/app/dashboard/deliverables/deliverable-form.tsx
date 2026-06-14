"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  createDeliverableAction,
  updateDeliverableAction,
  type Deliverable,
} from "./actions";
import { STATUS_LABEL, STATUS_ORDER } from "./status";

export type ProjectOption = {
  id: string;
  name: string;
  client_name: string | null;
};

type Props =
  | {
      mode: "create";
      projects: ProjectOption[];
      defaultProjectId?: string;
      deliverable?: undefined;
    }
  | {
      mode: "edit";
      projects: ProjectOption[];
      deliverable: Deliverable;
      defaultProjectId?: undefined;
    };

export function DeliverableForm(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const d = props.mode === "edit" ? props.deliverable : undefined;
  const defaultProjectId = d?.project_id ?? props.defaultProjectId ?? "";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res =
        props.mode === "create"
          ? await createDeliverableAction(fd)
          : await updateDeliverableAction(fd);
      if (res && !res.ok) setError(res.error);
      else if (res?.ok) setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          props.mode === "create"
            ? "New deliverable"
            : (d?.title ?? "Deliverable")
        }
        subtitle={
          <Link href="/dashboard/deliverables" className="hover:underline">
            ← Deliverables
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
              <input type="hidden" name="id" value={d?.id} />
            )}

            <Field label="Project">
              <Select
                name="project_id"
                required
                defaultValue={defaultProjectId}
              >
                <option value="" disabled>
                  Select a project…
                </option>
                {props.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.client_name ? ` — ${p.client_name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Title">
              <Input name="title" required defaultValue={d?.title ?? ""} />
            </Field>

            <Field label="Video URL">
              <Input
                name="video_url"
                type="url"
                placeholder="https://…"
                defaultValue={d?.video_url ?? ""}
              />
            </Field>

            <Field label="Thumbnail URL">
              <Input
                name="thumbnail_url"
                type="url"
                placeholder="https://…"
                defaultValue={d?.thumbnail_url ?? ""}
              />
            </Field>

            <Field label="Status">
              <Select name="status" defaultValue={d?.status ?? "draft"}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>

            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                name="client_visible"
                defaultChecked={d?.client_visible ?? false}
                className="h-4 w-4 rounded border-ink/20 text-brand focus:ring-brand/30"
              />
              Visible to client
            </label>

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
                href="/dashboard/deliverables"
                className="text-sm text-ink/50 hover:text-ink/80"
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
      <label className="text-sm font-medium text-ink/80">{label}</label>
      {children}
    </div>
  );
}
