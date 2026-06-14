import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/charts/count-up";
import { MonthlyBars } from "@/components/charts/bars";
import { Donut, type DonutSlice } from "@/components/charts/donut";
import { getDonutPalette } from "@/components/charts/palette";
import { formatDt } from "@/lib/format";

// Defensive helper so one failing query can't take down the whole page.
async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[analytics:${label}]`, err);
    return fallback;
  }
}

type DeliverableStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "delivered"
  | "revision_requested";

const DELIVERABLE_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  delivered: "Delivered",
  revision_requested: "Revision requested",
};

const DELIVERABLE_TONE: Record<
  string,
  "neutral" | "amber" | "violet" | "green" | "red" | "slate"
> = {
  draft: "neutral",
  in_review: "amber",
  approved: "violet",
  delivered: "green",
  revision_requested: "red",
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
// The Supabase client is untyped here; the query builder is treated loosely so
// optional filters can be chained without fighting generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

async function countOf(
  supabase: SupabaseClient,
  table: string,
  label: string,
  apply?: (q: Query) => Query,
): Promise<number> {
  return safe(
    async () => {
      let q: Query = supabase
        .from(table)
        .select("id", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count } = await q;
      return (count as number | null) ?? 0;
    },
    0,
    label,
  );
}

export default async function AnalyticsPage() {
  await requireStaff();
  const supabase = await createClient();

  const now = new Date();

  // 12-month window for the bars.
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  const oldestStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    .toISOString()
    .slice(0, 10);

  // ---- KPI counts ----
  const totalClients = await countOf(supabase, "clients", "totalClients");
  const totalProjects = await countOf(supabase, "projects", "totalProjects");
  const activeProjects = await countOf(supabase, "projects", "activeProjects", (q) =>
    q.eq("status", "active"),
  );
  const totalDeliverables = await countOf(
    supabase,
    "deliverables",
    "totalDeliverables",
  );
  const deliveredCount = await countOf(
    supabase,
    "deliverables",
    "deliveredCount",
    (q) => q.eq("status", "delivered"),
  );
  const totalLeads = await countOf(supabase, "leads", "totalLeads");
  const wonLeads = await countOf(supabase, "leads", "wonLeads", (q) =>
    q.eq("status", "won"),
  );

  // ---- Finance (mirror dashboard page bucketing) ----
  type DevisRow = {
    date: string;
    total_dt: number;
    status: string;
    kind: string;
  };
  type PaymentRow = { amount_dt: number; paid_at: string };

  const devisRows: DevisRow[] = await safe(
    async () => {
      const { data } = await supabase
        .from("devis")
        .select("date, total_dt, status, kind")
        .gte("date", oldestStart);
      return (data ?? []) as DevisRow[];
    },
    [],
    "devis",
  );
  const paymentRows: PaymentRow[] = await safe(
    async () => {
      const { data } = await supabase
        .from("payments")
        .select("amount_dt, paid_at")
        .gte("paid_at", oldestStart);
      return (data ?? []) as PaymentRow[];
    },
    [],
    "payments",
  );

  // Total invoiced = sum of facture (invoice) totals, excluding drafts/rejected.
  let totalInvoiced = 0;
  const invoicedByMonth = new Map<string, number>();
  for (const d of devisRows) {
    if (d.status === "rejected" || d.status === "draft") continue;
    if (d.kind !== "facture") continue;
    const amt = Number(d.total_dt ?? 0);
    totalInvoiced += amt;
    const dt = new Date(d.date);
    const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    invoicedByMonth.set(k, (invoicedByMonth.get(k) ?? 0) + amt);
  }

  let totalPaid = 0;
  const paidByMonth = new Map<string, number>();
  for (const p of paymentRows) {
    const amt = Number(p.amount_dt ?? 0);
    totalPaid += amt;
    const dt = new Date(p.paid_at);
    const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    paidByMonth.set(k, (paidByMonth.get(k) ?? 0) + amt);
  }

  const monthlySeries = months.map((m) => ({
    label: m.label,
    paid: paidByMonth.get(m.key) ?? 0,
    invoiced: invoicedByMonth.get(m.key) ?? 0,
  }));

  // ---- Deliverables-by-status donut ----
  type StatusRow = { status: string };
  const deliverableStatuses: StatusRow[] = await safe(
    async () => {
      const { data } = await supabase.from("deliverables").select("status");
      return (data ?? []) as StatusRow[];
    },
    [],
    "deliverableStatuses",
  );
  const statusTally = new Map<string, number>();
  for (const r of deliverableStatuses) {
    const s = r.status ?? "draft";
    statusTally.set(s, (statusTally.get(s) ?? 0) + 1);
  }
  const palette = getDonutPalette();
  const donutData: DonutSlice[] = Array.from(statusTally.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, value], i) => ({
      label: DELIVERABLE_LABEL[status] ?? status,
      value,
      color: palette[i % palette.length],
    }));
  const deliverablesTotal = donutData.reduce((s, d) => s + d.value, 0);

  // ---- Recent activity: latest deliverables ----
  type RecentDeliverable = {
    id: string;
    title: string;
    status: DeliverableStatus;
    created_at: string;
    client: string | null;
  };
  const recentDeliverables: RecentDeliverable[] = await safe(
    async () => {
      const { data } = await supabase
        .from("deliverables")
        .select("id, title, status, created_at, clients:client_id(name)")
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []).map((d) => {
        const raw = d as {
          id: string;
          title: string;
          status: string;
          created_at: string;
          clients: { name: string } | { name: string }[] | null;
        };
        const c = Array.isArray(raw.clients) ? raw.clients[0] : raw.clients;
        return {
          id: raw.id,
          title: raw.title,
          status: (raw.status as DeliverableStatus) ?? "draft",
          created_at: raw.created_at,
          client: c?.name ?? null,
        };
      });
    },
    [] as RecentDeliverable[],
    "recentDeliverables",
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Analytics"
        subtitle="Insights"
        description="Read-only overview of clients, projects, delivery and revenue."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Clients" value={totalClients} />
        <Kpi
          label="Projects"
          value={totalProjects}
          sub={`${activeProjects} active`}
        />
        <Kpi
          label="Deliverables"
          value={totalDeliverables}
          sub={`${deliveredCount} delivered`}
        />
        <Kpi label="Leads" value={totalLeads} sub={`${wonLeads} won`} />
        <KpiMoney label="Invoiced" value={totalInvoiced} />
        <KpiMoney label="Paid" value={totalPaid} />
        <KpiMoney
          label="Outstanding"
          value={Math.max(0, totalInvoiced - totalPaid)}
        />
        <Kpi
          label="Active projects"
          value={activeProjects}
          sub={`of ${totalProjects}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue bars */}
        <Card variant="ink" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoiced vs paid · last 12 months</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBars series={monthlySeries} />
          </CardContent>
        </Card>

        {/* Deliverables donut */}
        <Card variant="ink">
          <CardHeader>
            <CardTitle>Deliverables by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliverablesTotal === 0 ? (
              <p className="py-8 text-center text-sm text-ink/55">No data yet.</p>
            ) : (
              <>
                <Donut
                  data={donutData}
                  centerLabel={String(deliverablesTotal)}
                  centerSub="Total"
                />
                <ul className="space-y-2">
                  {donutData.map((d) => {
                    const pct =
                      deliverablesTotal > 0
                        ? (d.value / deliverablesTotal) * 100
                        : 0;
                    return (
                      <li
                        key={d.label}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: d.color }}
                          />
                          <span className="truncate text-ink/75">{d.label}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-semibold text-ink">
                            {d.value}
                          </span>
                          <span className="ml-2 text-[11px] text-ink/45">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card variant="ink">
        <CardHeader>
          <CardTitle>Recent deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDeliverables.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/55">
              No recent activity.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recentDeliverables.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {d.title}
                    </p>
                    <p className="truncate text-xs text-ink/55">
                      {d.client ?? "—"} ·{" "}
                      {new Date(d.created_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <Badge tone={DELIVERABLE_TONE[d.status] ?? "neutral"} dot>
                    {DELIVERABLE_LABEL[d.status] ?? d.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card variant="ink">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          <CountUp to={value} />
        </p>
        {sub && <p className="mt-1 text-xs text-ink/55">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function KpiMoney({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="ink">
      <CardContent className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          <CountUp to={value} decimals={0} suffix=" DT" />
        </p>
        <p className="mt-1 text-xs text-ink/45">{formatDt(value)}</p>
      </CardContent>
    </Card>
  );
}
