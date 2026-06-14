import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { MessageBox, type MessageItem } from "./message-box";

type ProfileRef = { full_name: string | null; role: string | null };

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  profiles: ProfileRef | ProfileRef[] | null;
};

function authorProfile(p: MessageRow["profiles"]): ProfileRef | null {
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

export default async function PortalMessages() {
  const session = await requireClient();
  const supabase = await createClient();

  // RLS returns only this client's messages.
  const { data } = await supabase
    .from("messages")
    .select(
      "id, body, created_at, author_id, profiles:author_id(full_name, role)",
    )
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as MessageRow[];

  const messages: MessageItem[] = rows.map((m) => {
    const author = authorProfile(m.profiles);
    const isStaff = author?.role != null && author.role !== "client";
    return {
      id: m.id,
      body: m.body,
      created_at: m.created_at,
      author_label: author?.full_name ?? (isStaff ? "Team" : "Client"),
      is_mine: m.author_id === session.id,
      is_staff: isStaff,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Messages</h1>
        <p className="mt-1 text-sm text-ink/55">
          Chat directly with your team.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <MessageBox messages={messages} />
        </CardContent>
      </Card>
    </div>
  );
}
