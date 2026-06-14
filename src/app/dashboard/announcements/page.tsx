import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  AnnouncementsView,
  type AnnouncementRow,
  type ClientOption,
} from "./announcements-view";
import type { Audience } from "./actions";

type ProfileRef = { full_name: string | null; username: string } | null;
type ClientRef = { name: string } | null;
type Row = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  client_id: string | null;
  created_at: string;
  author: ProfileRef | ProfileRef[];
  client: ClientRef | ClientRef[];
};

function authorLabel(p: ProfileRef | ProfileRef[]): string {
  const profile = Array.isArray(p) ? p[0] : p;
  if (!profile) return "Unknown";
  return profile.full_name ?? `@${profile.username}`;
}

function clientName(c: ClientRef | ClientRef[]): string | null {
  const client = Array.isArray(c) ? c[0] : c;
  return client?.name ?? null;
}

export default async function AnnouncementsPage() {
  await requireStaff();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("announcements")
    .select(
      "id, title, body, audience, client_id, created_at, author:profiles!created_by(full_name, username), client:clients!client_id(name)",
    )
    .order("created_at", { ascending: false });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });

  const announcements: AnnouncementRow[] = ((rows ?? []) as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience,
    created_at: r.created_at,
    author_name: authorLabel(r.author),
    target_client: clientName(r.client),
  }));

  const clientOptions: ClientOption[] = ((clients ?? []) as ClientOption[]).map(
    (c) => ({ id: c.id, name: c.name }),
  );

  return (
    <AnnouncementsView
      announcements={announcements}
      clients={clientOptions}
    />
  );
}
