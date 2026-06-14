import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

type ProfileRef = { full_name: string | null };

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  profiles: ProfileRef | ProfileRef[] | null;
};

function authorName(p: AnnouncementRow["profiles"]): string {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.full_name ?? "Team";
}

export default async function PortalAnnouncements() {
  await requireClient();
  const supabase = await createClient();

  // RLS returns only announcements visible to this client.
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, profiles:created_by(full_name)")
    .order("created_at", { ascending: false });

  const announcements = (data ?? []) as AnnouncementRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">News</h1>
        <p className="mt-1 text-sm text-ink/55">
          Updates and announcements from your team.
        </p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-ink/50">
            No news yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 p-5">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  {a.title}
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {a.body}
                </p>
                <p className="pt-1 text-xs text-ink/45">
                  {authorName(a.profiles)} · {formatDate(a.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
