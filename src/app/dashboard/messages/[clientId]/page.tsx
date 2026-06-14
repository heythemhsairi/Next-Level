import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { MessageThread, type ThreadMessage } from "./message-thread";

type ProfileRef = { full_name: string | null; username: string } | null;
type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: ProfileRef | ProfileRef[];
};

function authorLabel(p: ProfileRef | ProfileRef[]): string {
  const profile = Array.isArray(p) ? p[0] : p;
  if (!profile) return "Unknown";
  return profile.full_name ?? `@${profile.username}`;
}

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await requireStaff();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();
  if (!client) notFound();

  const { data: rows } = await supabase
    .from("messages")
    .select(
      "id, body, created_at, author_id, author:profiles!author_id(full_name, username)",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  const messages: ThreadMessage[] = ((rows ?? []) as MessageRow[]).map((m) => ({
    id: m.id,
    body: m.body,
    created_at: m.created_at,
    author_name: authorLabel(m.author),
    is_mine: m.author_id === session.id,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={(client as { name: string }).name}
        subtitle={
          <Link href="/dashboard/messages" className="hover:underline">
            ← Messages
          </Link>
        }
      />
      <MessageThread clientId={clientId} messages={messages} />
    </div>
  );
}
