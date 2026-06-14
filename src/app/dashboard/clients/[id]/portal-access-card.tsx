"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClientLoginAction } from "../actions";

export type ClientLogin = {
  id: string;
  username: string;
  full_name: string | null;
};

export function PortalAccessCard({
  clientId,
  clientEmail,
  logins,
}: {
  clientId: string;
  clientEmail: string | null;
  logins: ClientLogin[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("client_id", clientId);
    start(async () => {
      const res = await createClientLoginAction(formData);
      if (res.ok) {
        setDone(true);
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portal access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {logins.length > 0 ? (
          <ul className="space-y-2">
            {logins.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="text-ink/85">
                  {l.full_name ?? l.username}
                </span>
                <Badge tone="green">Active login</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/55">
            This client has no portal login yet. Create one so they can sign in
            to see their videos, invoices, and tasks.
          </p>
        )}

        {done && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            Portal login created.
          </p>
        )}

        {open ? (
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                Login email
              </label>
              <Input
                name="email"
                type="email"
                defaultValue={clientEmail ?? ""}
                placeholder="client@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                Full name (optional)
              </label>
              <Input name="full_name" type="text" placeholder="Contact name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                Temporary password
              </label>
              <Input
                name="password"
                type="text"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <p className="text-xs text-ink/45">
                Share this with the client; they sign in with their email.
              </p>
            </div>
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Creating…" : "Create login"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            + Create portal login
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
