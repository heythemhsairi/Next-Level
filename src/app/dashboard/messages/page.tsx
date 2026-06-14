import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MessagesView, type ConversationRow } from "./messages-view";

type ClientRow = { id: string; name: string };
type MessageRow = { client_id: string; body: string; created_at: string };

export default async function MessagesPage() {
  await requireStaff();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });

  // Pull all messages and reduce to the latest per client. The volume here is
  // small (one agency's clients), so a single ordered query is sufficient.
  const { data: messages } = await supabase
    .from("messages")
    .select("client_id, body, created_at")
    .order("created_at", { ascending: false });

  const latestByClient = new Map<string, MessageRow>();
  for (const m of (messages ?? []) as MessageRow[]) {
    if (!latestByClient.has(m.client_id)) latestByClient.set(m.client_id, m);
  }

  const conversations: ConversationRow[] = ((clients ?? []) as ClientRow[]).map(
    (c) => {
      const last = latestByClient.get(c.id);
      return {
        id: c.id,
        name: c.name,
        last_body: last?.body ?? null,
        last_at: last?.created_at ?? null,
      };
    },
  );

  return <MessagesView conversations={conversations} />;
}
