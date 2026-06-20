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
  const [{ data: client }, { data: videos }, { data: invoices }, { data: tasks }] =
    await Promise.all([
      session.client_id
        ? supabase.from("clients").select("name").eq("id", session.client_id).maybeSingle()
        : Promise.resolve({ data: null as { name: string } | null }),
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
  const firstName = (client?.name ?? session.full_name ?? session.username).split(
    " ",
  )[0];

  return (
    <div className="space-y-8">
      {/* Cinematic hero with a live delivery-progress ring. */}
      <section className="reveal relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-brand via-brand-dark to-[#170406] p-6 shadow-brand-glow sm:p-8 surface-grain">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-light/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-brand/40 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-display font-bold uppercase tracking-[0.22em] text-cream/80">
              Your studio · {client?.name ?? "Welcome"}
            </p>
            <h1 className="mt-2 text-3xl font-display font-extrabold tracking-tight text-white md:text-[38px]">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-1.5 text-sm text-cream/70">
              Your videos, payments, and work in progress — all in one place.
            </p>
          </div>

          {totalVideos > 0 && (
            <div className="flex shrink-0 items-center gap-3">
              <ProgressRing
                value={deliveryPct}
                size={84}
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Videos delivered" value={String(deliveredCount)} />
        <Stat
          label="Outstanding balance"
          value={formatDt(outstanding)}
          tone={outstanding > 0 ? "alert" : "ok"}
        />
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
