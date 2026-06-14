"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/format";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  type Audience,
} from "./actions";

export type ClientOption = { id: string; name: string };

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  created_at: string;
  author_name: string;
  target_client: string | null;
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Everyone",
  clients: "Clients",
  team: "Team",
};

const AUDIENCE_TONE: Record<Audience, "blue" | "accent" | "violet"> = {
  all: "blue",
  clients: "accent",
  team: "violet",
};

export function AnnouncementsView({
  announcements,
  clients,
}: {
  announcements: AnnouncementRow[];
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>("all");
  const [pending, start] = useTransition();

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const res = await createAnnouncementAction(fd);
      if (res.ok) {
        form.reset();
        setAudience("all");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      const res = await deleteAnnouncementAction(fd);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Broadcast updates to your team, your clients, or everyone."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="ink" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <Field label="Title">
                <Input name="title" required placeholder="What's new?" />
              </Field>
              <Field label="Body">
                <Textarea
                  name="body"
                  required
                  rows={4}
                  placeholder="Write your announcement…"
                />
              </Field>
              <Field label="Audience">
                <select
                  name="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-ink/90 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="all">Everyone</option>
                  <option value="clients">Clients</option>
                  <option value="team">Team</option>
                </select>
              </Field>
              {audience !== "team" && (
                <Field label="Target client (optional)">
                  <select
                    name="client_id"
                    defaultValue=""
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-ink/90 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="">All clients</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={pending}>
                {pending ? "Posting…" : "Post announcement"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {announcements.length === 0 ? (
            <Card variant="ink">
              <CardContent className="p-6">
                <p className="text-sm text-ink/50">No announcements yet.</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((a) => (
              <Card key={a.id} variant="ink">
                <CardContent className="space-y-3 p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                          {a.title}
                        </h3>
                        <Badge tone={AUDIENCE_TONE[a.audience]}>
                          {AUDIENCE_LABEL[a.audience]}
                        </Badge>
                        {a.audience !== "team" && (
                          <Badge tone="slate">
                            {a.target_client ?? "All clients"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => onDelete(a.id)}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink/85">
                    {a.body}
                  </p>
                  <p className="text-[11px] text-ink/40">
                    {a.author_name} · {formatDate(a.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
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
      <label className="text-sm font-medium text-ink/70">{label}</label>
      {children}
    </div>
  );
}
