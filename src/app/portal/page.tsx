import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDt, formatDate } from "@/lib/format";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_TONE,
  type DeliverableStatus,
} from "./deliverable-status";

type RecentVideo = {
  id: string;
  title: string;
  status: DeliverableStatus;
  delivered_at: string | null;
  video_url: string | null;
};

export default async function PortalHome() {
  const session = await requireClient();
  const supabase = await createClient();

  // RLS already scopes every query to this client's own rows.
  const [{ data: videos }, { data: invoices }, { data: tasks }] =
    await Promise.all([
      supabase
        .from("deliverables")
        .select("id, title, status, delivered_at, video_url")
        .eq("client_visible", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("devis")
        .select("id, total_dt, payment_status, kind")
        .eq("kind", "facture"),
      supabase.from("tasks").select("id, status"),
    ]);

  const deliveredCount = (videos ?? []).filter(
    (v) => v.status === "delivered",
  ).length;
  const activeTasks = (tasks ?? []).filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  ).length;
  const outstanding = (invoices ?? [])
    .filter((i) => i.payment_status !== "paid")
    .reduce((sum, i) => sum + Number(i.total_dt ?? 0), 0);

  const recentVideos = ((videos ?? []) as RecentVideo[]).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Here's the latest on your videos, payments, and work in progress.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Videos delivered" value={String(deliveredCount)} />
        <Stat label="Outstanding balance" value={formatDt(outstanding)} />
        <Stat label="Active tasks" value={String(activeTasks)} />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent videos</CardTitle>
            <Link
              href="/portal/videos"
              className="text-xs font-semibold text-brand hover:text-brand-light"
            >
              See all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentVideos.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/50">
              No videos shared with you yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recentVideos.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink/90">
                      {v.title}
                    </p>
                    <p className="text-xs text-ink/45">
                      {v.delivered_at
                        ? `Delivered ${formatDate(v.delivered_at)}`
                        : "In progress"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={DELIVERABLE_STATUS_TONE[v.status]}>
                      {DELIVERABLE_STATUS_LABEL[v.status]}
                    </Badge>
                    {v.video_url && (
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand hover:text-brand-light"
                      >
                        Watch →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-ink/45">{label}</p>
        <p className="mt-1 text-2xl font-black text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
