import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { VideoCard, type VideoCardData, type FeedbackItem } from "./video-card";
import type { DeliverableStatus } from "../deliverable-status";

type DeliverableRow = {
  id: string;
  title: string;
  status: DeliverableStatus;
  video_url: string | null;
  thumbnail_url: string | null;
  delivered_at: string | null;
  projects: { name: string } | { name: string }[] | null;
};

type FeedbackRow = {
  id: string;
  deliverable_id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  profiles: { full_name: string | null; username: string } | { full_name: string | null; username: string }[] | null;
};

function projectName(p: DeliverableRow["projects"]): string | null {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? null;
}

function authorName(p: FeedbackRow["profiles"]): string {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.full_name ?? (row?.username ? `@${row.username}` : "Team");
}

export default async function PortalVideos() {
  const session = await requireClient();
  const supabase = await createClient();

  // RLS returns only client_visible deliverables on this client's projects.
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select(
      "id, title, status, video_url, thumbnail_url, delivered_at, projects(name)",
    )
    .eq("client_visible", true)
    .order("created_at", { ascending: false });

  const rows = (deliverables ?? []) as DeliverableRow[];

  // Fetch all feedback for these deliverables in one query.
  const ids = rows.map((r) => r.id);
  let feedbackByDeliverable = new Map<string, FeedbackItem[]>();
  if (ids.length > 0) {
    const { data: fb } = await supabase
      .from("deliverable_feedback")
      .select("id, deliverable_id, body, created_at, author_id, profiles:author_id(full_name, username)")
      .in("deliverable_id", ids)
      .order("created_at", { ascending: true });

    feedbackByDeliverable = ((fb ?? []) as FeedbackRow[]).reduce((map, f) => {
      const item: FeedbackItem = {
        id: f.id,
        body: f.body,
        created_at: f.created_at,
        author_name: authorName(f.profiles),
        is_mine: f.author_id === session.id,
      };
      const list = map.get(f.deliverable_id) ?? [];
      list.push(item);
      map.set(f.deliverable_id, list);
      return map;
    }, new Map<string, FeedbackItem[]>());
  }

  const videos: VideoCardData[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    video_url: r.video_url,
    thumbnail_url: r.thumbnail_url,
    delivered_at: r.delivered_at,
    project_name: projectName(r.projects),
    feedback: feedbackByDeliverable.get(r.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">
          My Videos
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Watch each video, then approve it or request changes — your team gets
          notified right away.
        </p>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-ink/50">
            No videos have been shared with you yet. They'll appear here as soon
            as your team delivers them.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
