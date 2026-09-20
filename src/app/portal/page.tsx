import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/charts/progress-ring";
import { formatDt, formatDate } from "@/lib/format";
import {
  DELIVERABLE_STATUS_LABEL,
  DELIVERABLE_STATUS_TONE,
  type DeliverableStatus,
} from "./deliverable-status";
import { ProjectProgressCard, type ProjectProgress } from "./project-progress";
import { UpcomingTimeline, type TimelineItem } from "./upcoming-timeline";

type RecentVideo = {
  id: string;
  title: string;
  status: DeliverableStatus;
  delivered_at: string | null;
  video_url: string | null;
  project_id: string | null;
};

export default async function PortalHome() {
  const session = await requireClient();
  const supabase = await createClient();

  const todayIso = new Date().toISOString().slice(0, 10);

  // RLS already scopes every query to this client's own rows.
  const [
    { data: client },
    { data: videos },
    { data: invoices },
    { data: tasks },
    { data: projects },
    { data: upcoming },
  ] = await Promise.all([
    session.client_id
      ? supabase.from("clients").select("name").eq("id", session.client_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
    supabase
      .from("deliverables")
      .select("id, title, status, delivered_at, video_url, project_id")
      .eq("client_visible", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("devis")
      .select("id, total_dt, payment_status, kind")
      .eq("kind", "facture"),
    supabase.from("tasks").select("id, status"),
    supabase
      .from("projects")
      .select("id, name, status")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, deadline, projects:project_id(name)")
      .not("deadline", "is", null)
      .gte("deadline", todayIso)
      .in("status", ["todo", "in_progress", "review"])
      .order("deadline", { ascending: true })
      .limit(6),
  ]);

  const allVideos = (videos ?? []) as RecentVideo[];
  const totalVideos = allVideos.length;
  const deliveredCount = allVideos.filter((v) => v.status === "delivered").length;
  const activeTasks = (tasks ?? []).filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  ).length;
  const outstanding = (invoices ?? [])
    .filter((i) => i.payment_status !== "paid")
    .reduce((sum, i) => sum + Number(i.total_dt ?? 0), 0);

  const deliveryPct =
    totalVideos > 0 ? Math.round((deliveredCount / totalVideos) * 100) : 0;
  const recentVideos = allVideos.slice(0, 5);
  const pendingApproval = allVideos.filter((v) => v.status === "in_review");
  const firstName = (client?.name ?? session.full_name ?? session.username).split(
    " ",
  )[0];

  // This month's client-visible content (links to the content calendar).
  const { data: contentPosts, error: contentError } = await supabase
    .from("social_posts")
    .select("id, title, status, scheduled_at")
    .eq("client_visible", true);
  const nowD = new Date();
  const thisMonthPosts = (contentPosts ?? []).filter((p) => {
    if (!p.scheduled_at) return false;
    const d = new Date(p.scheduled_at);
    return (
      d.getFullYear() === nowD.getFullYear() && d.getMonth() === nowD.getMonth()
    );
  }).sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  const contentThisMonth = thisMonthPosts.length;

  // Per-project progress: delivered videos vs total videos shared on it.
  const progressByProject = new Map<string, { delivered: number; total: number }>();
  for (const v of allVideos) {
    if (!v.project_id) continue;
    const agg = progressByProject.get(v.project_id) ?? { delivered: 0, total: 0 };
    agg.total += 1;
    if (v.status === "delivered") agg.delivered += 1;
    progressByProject.set(v.project_id, agg);
  }
  const projectProgress: ProjectProgress[] = (projects ?? []).map((p) => {
    const agg = progressByProject.get(p.id) ?? { delivered: 0, total: 0 };
    return { id: p.id, name: p.name, delivered: agg.delivered, total: agg.total };
  });

  // Upcoming timeline from tasks with future deadlines.
  const timeline: TimelineItem[] = (upcoming ?? []).map((tk) => {
    const proj = Array.isArray(tk.projects) ? tk.projects[0] : tk.projects;
    return {
      id: tk.id,
      title: tk.title,
      project: proj?.name ?? null,
      date: tk.deadline as string,
    };
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="reveal rounded-2xl border border-white/10 bg-ink-2 p-5 sm:p-7">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-display font-bold uppercase tracking-[0.18em] text-brand-light">
              Your studio · {client?.name ?? "Welcome"}
            </p>
            <h1 className="mt-2 text-balance text-2xl font-display font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-cream/60">
              See what is planned, what needs your feedback, and what is ready to share.
            </p>
          </div>

          {totalVideos > 0 && (
            <div className="flex shrink-0 items-center gap-3">
              <ProgressRing
                value={deliveryPct}
                size={70}
                thickness={8}
                color="#FFFFFF"
                trackColor="rgba(0,0,0,0.25)"
                label={
                  <span className="text-base font-bold text-white tabular-nums">
                    {deliveryPct}%
                  </span>
                }
              />
              <div className="text-xs leading-tight text-cream/75">
                <p className="font-semibold text-white">
                  {deliveredCount} of {totalVideos}
                </p>
                <p>videos delivered</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What needs you today — client-facing approvals queue. */}
      {pendingApproval.length > 0 && (
        <section className="reveal flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand/[0.08] p-4 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-cream">
              {pendingApproval.length}{" "}
              {pendingApproval.length === 1 ? "video needs" : "videos need"} your
              review
            </p>
            <p className="text-xs text-cream/60">
              Approve or request changes so your team can keep moving.
            </p>
          </div>
          <Link
            href="/portal/videos"
            className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Review now
          </Link>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(250px,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-ink-2 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-light">This month</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Your content plan</h2>
              <p className="mt-1 text-sm text-cream/55">{contentError ? "Your content calendar is being prepared." : contentThisMonth > 0 ? `${contentThisMonth} planned ${contentThisMonth === 1 ? "post" : "posts"}` : "Your team will add planned content here."}</p>
            </div>
            <Link href="/portal/calendar" className="shrink-0 text-sm font-semibold text-brand-light hover:text-white">Calendar →</Link>
          </div>
          {thisMonthPosts.length > 0 && (
            <ul className="mt-5 divide-y divide-white/10 border-t border-white/10">
              {thisMonthPosts.slice(0, 3).map((post) => (
                <li key={post.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0 truncate text-cream/85">{post.title}</span>
                  <span className="shrink-0 text-xs text-cream/50">{post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : post.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {deliveredCount > 0 && <Stat label="Videos delivered" value={String(deliveredCount)} />}
          {activeTasks > 0 && <Stat label="Active tasks" value={String(activeTasks)} />}
          {outstanding > 0 && <Stat label="Outstanding balance" value={formatDt(outstanding)} tone="alert" />}
          {deliveredCount === 0 && activeTasks === 0 && outstanding === 0 && (
            <div className="col-span-2 flex items-center rounded-2xl border border-white/10 bg-ink-2 p-5 text-sm text-cream/55">Your project activity will appear here as work moves forward.</div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProjectProgressCard projects={projectProgress} />
        <UpcomingTimeline items={timeline} />
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
              No videos shared with you yet — your team will post them here.
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

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "alert" | "ok";
}) {
  const accent =
    tone === "alert"
      ? "text-brand-light"
      : tone === "ok"
        ? "text-emerald-400"
        : "text-ink";
  return (
    <Card interactive>
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">
          {label}
        </p>
        <p className={`mt-1.5 text-2xl font-display font-extrabold tracking-tight ${accent}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
