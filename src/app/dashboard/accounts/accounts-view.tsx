"use client";

import { useMemo, useState, useTransition } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import {
  inviteClientAccountAction,
  resetAccessAction,
  suspendAccountAction,
  reactivateAccountAction,
  editAccountAction,
  type AccountActionResult,
} from "./actions";

export type AccountRow = {
  id: string;
  username: string;
  fullName: string | null;
  role: string;
  status: string;
  email: string | null;
  lastSignInAt: string | null;
  clientId: string | null;
  clientName: string | null;
};
export type ClientOption = { id: string; name: string };
export type AuditRow = {
  id: string;
  action: string;
  actor: string;
  target: string;
  createdAt: string;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso).getTime();
  const mins = Math.round((Date.now() - d) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function roleTone(role: string): "ink" | "blue" | "violet" | "neutral" {
  if (role === "admin") return "ink";
  if (role === "sales") return "blue";
  if (role === "client") return "violet";
  return "neutral";
}

export function AccountsView({
  accounts,
  clients,
  audit,
}: {
  accounts: AccountRow[];
  clients: ClientOption[];
  audit: AuditRow[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (roleFilter !== "all" && a.role !== roleFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.username.toLowerCase().includes(q) ||
        (a.fullName ?? "").toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.clientName ?? "").toLowerCase().includes(q)
      );
    });
  }, [accounts, query, roleFilter, statusFilter]);

  function run(
    action: () => Promise<AccountActionResult>,
    onOk?: (r: Extract<AccountActionResult, { ok: true }>) => void,
  ) {
    start(async () => {
      const r = await action();
      if (r.ok) {
        if (r.link) setLink(r.link);
        toast.success(r.message ?? "Done.");
        onOk?.(r);
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Accounts"
        subtitle="Admin"
        description="Create, suspend, and reset the logins for your team and client portal. Invites use a set-password link — no shared passwords."
        action={
          <Button size="sm" onClick={() => setInviteOpen((v) => !v)}>
            {inviteOpen ? "Close" : "Invite client login"}
          </Button>
        }
      />

      {inviteOpen && (
        <form
          className="grid gap-3 rounded-xl border border-ink/10 bg-white p-4 sm:grid-cols-4"
          action={(fd) =>
            run(
              () => inviteClientAccountAction(fd),
              () => setInviteOpen(false),
            )
          }
        >
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-ink/60">
              Client
            </label>
            <Select name="client_id" required defaultValue="">
              <option value="" disabled>
                Choose client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-ink/60">
              Contact name
            </label>
            <Input name="full_name" placeholder="e.g. Salma Cherni" />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-ink/60">
              Email
            </label>
            <Input name="email" type="email" required placeholder="name@company.com" />
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button type="submit" size="sm" disabled={pending} className="w-full">
              {pending ? "Creating…" : "Create & get link"}
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search name, username, email, client…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="sm:max-w-[160px]"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="sales">Sales</option>
          <option value="client">Client</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:max-w-[160px]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
        <span className="text-sm text-ink/50 sm:ml-auto">
          {filtered.length} account{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-ink/10 bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/8 text-left text-xs uppercase tracking-wide text-ink/45">
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last sign-in</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">
                    {a.fullName || a.username}
                  </div>
                  <div className="text-xs text-ink/50">
                    @{a.username}
                    {a.email ? ` · ${a.email}` : ""}
                    {a.clientName ? ` · ${a.clientName}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={roleTone(a.role)}>{a.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={a.status === "suspended" ? "red" : "green"}>
                    {a.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ink/60">
                  {timeAgo(a.lastSignInAt)}
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    account={a}
                    pending={pending}
                    onReset={() =>
                      run(() => {
                        const fd = new FormData();
                        fd.set("user_id", a.id);
                        fd.set("email", a.email ?? "");
                        return resetAccessAction(fd);
                      })
                    }
                    onSuspend={() =>
                      run(() => {
                        const fd = new FormData();
                        fd.set("user_id", a.id);
                        return suspendAccountAction(fd);
                      })
                    }
                    onReactivate={() =>
                      run(() => {
                        const fd = new FormData();
                        fd.set("user_id", a.id);
                        return reactivateAccountAction(fd);
                      })
                    }
                    onEdit={() => setEditing(a)}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/45">
                  No accounts match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-xl border border-ink/10 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium text-ink">
                  {a.fullName || a.username}
                </div>
                <div className="truncate text-xs text-ink/50">
                  @{a.username}
                  {a.email ? ` · ${a.email}` : ""}
                </div>
                {a.clientName && (
                  <div className="truncate text-xs text-ink/45">
                    {a.clientName}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={roleTone(a.role)}>{a.role}</Badge>
                <Badge tone={a.status === "suspended" ? "red" : "green"}>
                  {a.status}
                </Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-ink/50">
              Last sign-in: {timeAgo(a.lastSignInAt)}
            </div>
            <div className="mt-3">
              <RowActions
                account={a}
                pending={pending}
                onReset={() =>
                  run(() => {
                    const fd = new FormData();
                    fd.set("user_id", a.id);
                    fd.set("email", a.email ?? "");
                    return resetAccessAction(fd);
                  })
                }
                onSuspend={() =>
                  run(() => {
                    const fd = new FormData();
                    fd.set("user_id", a.id);
                    return suspendAccountAction(fd);
                  })
                }
                onReactivate={() =>
                  run(() => {
                    const fd = new FormData();
                    fd.set("user_id", a.id);
                    return reactivateAccountAction(fd);
                  })
                }
                onEdit={() => setEditing(a)}
              />
            </div>
          </div>
        ))}
      </div>

      {audit.length > 0 && (
        <div className="rounded-xl border border-ink/10 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Recent account activity
          </h2>
          <ul className="space-y-2 text-sm">
            {audit.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-2 text-ink/70">
                <span className="font-medium text-ink">{e.actor}</span>
                <span className="text-ink/50">{e.action}</span>
                <span className="font-medium text-ink">{e.target}</span>
                <span className="ml-auto text-xs text-ink/40">
                  {timeAgo(e.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {link && <LinkModal link={link} onClose={() => setLink(null)} />}
      {editing && (
        <EditModal
          account={editing}
          clients={clients}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(fd) =>
            run(
              () => editAccountAction(fd),
              () => setEditing(null),
            )
          }
        />
      )}
    </div>
  );
}

function RowActions({
  account,
  pending,
  onReset,
  onSuspend,
  onReactivate,
  onEdit,
}: {
  account: AccountRow;
  pending: boolean;
  onReset: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="ghost" size="sm" disabled={pending} onClick={onEdit}>
        Edit
      </Button>
      <Button variant="ghost" size="sm" disabled={pending} onClick={onReset}>
        Reset access
      </Button>
      {account.status === "suspended" ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={onReactivate}>
          Reactivate
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={pending} onClick={onSuspend}>
          Suspend
        </Button>
      )}
    </div>
  );
}

function LinkModal({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-ink">Set-password link</h3>
        <p className="mt-1 text-sm text-ink/60">
          Share this one-time link so they can set their password and sign in.
          It expires — generate a fresh one with “Reset access” if needed.
        </p>
        <div className="mt-4 break-all rounded-lg border border-ink/10 bg-cream-dark/30 p-3 text-xs text-ink/80">
          {link}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(link).then(
                () => {
                  setCopied(true);
                  toast.success("Link copied.");
                },
                () => toast.error("Copy failed — select and copy manually."),
              );
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  account,
  clients,
  pending,
  onClose,
  onSave,
}: {
  account: AccountRow;
  clients: ClientOption[];
  pending: boolean;
  onClose: () => void;
  onSave: (fd: FormData) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        action={(fd) => {
          fd.set("user_id", account.id);
          onSave(fd);
        }}
      >
        <h3 className="text-lg font-semibold text-ink">Edit account</h3>
        <p className="mt-1 text-sm text-ink/60">@{account.username}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/60">
              Display name
            </label>
            <Input name="full_name" defaultValue={account.fullName ?? ""} />
          </div>
          {account.role === "client" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">
                Email
              </label>
              <Input
                name="email"
                type="email"
                defaultValue={account.email ?? ""}
                placeholder="name@company.com"
              />
              <p className="mt-1 text-[11px] text-ink/45">
                Changing this updates their sign-in email.
              </p>
            </div>
          )}
          {account.role === "client" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/60">
                Linked client
              </label>
              <Select name="client_id" defaultValue={account.clientId ?? ""}>
                <option value="">— unchanged —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
