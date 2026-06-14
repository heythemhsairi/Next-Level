import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_TONE,
  type DeliverableStatus,
} from "../deliverable-status";

type Video = {
  id: string;
  title: string;
  status: DeliverableStatus;
  video_url: string | null;
  thumbnail_url: string | null;
  delivered_at: string | null;
  projects: { name: string } | { name: string }[] | null;
};

function projectName(p: Video["projects"]): string | null {
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? null;
}

export default async function PortalVideos() {
  await requireClient();
  const supabase = await createClient();

  // RLS returns only client_visible deliverables on this client's projects.
  const { data } = await supabase
    .from("deliverables")
    .select(
      "id, title, status, video_url, thumbnail_url, delivered_at, projects(name)",
    )
    .eq("client_visible", true)
    .order("created_at", { ascending: false });

  const videos = (data ?? []) as Video[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">
          My Videos
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Every video we've produced for you. Click “Watch” to open the link.
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="relative aspect-video bg-ink-soft">
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink/30">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4z M10 9l5 3-5 3z" />
                    </svg>
                  </div>
                )}
                <span className="absolute right-2 top-2">
                  <Badge tone={DELIVERABLE_STATUS_TONE[v.status]}>
                    {DELIVERABLE_STATUS_LABEL[v.status]}
                  </Badge>
                </span>
              </div>
              <CardContent className="space-y-2 p-4">
                <p className="font-semibold text-ink/90">{v.title}</p>
                <p className="text-xs text-ink/45">
                  {projectName(v.projects) ?? "—"}
                  {v.delivered_at
                    ? ` · Delivered ${formatDate(v.delivered_at)}`
                    : ""}
                </p>
                {v.video_url ? (
                  <a
                    href={v.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-light"
                  >
                    Watch →
                  </a>
                ) : (
                  <span className="text-sm text-ink/40">Link coming soon</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
