"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Donut, DonutLegend, type DonutSlice } from "@/components/charts/donut";
import { MonthlyBars, type BarPoint } from "@/components/charts/bars";
import type { AnyUserRole } from "@/lib/utils";
import {
  HeroRevenueCard,
  KpiCard,
  FeaturedCard,
  FeaturedEmptyCta,
} from "@/components/home/cards";
import { RecentDevisFeed } from "@/components/home/recent-devis-feed";
import { UpcomingTasksList, MyTasksList } from "@/components/home/tasks-lists";
import type {
  Counts,
  Revenue,
  Featured,
  RecentDevis,
  UpcomingTask,
} from "@/components/home/types";

type Props = {
  role: AnyUserRole;
  fullName: string;
  counts: Counts;
  revenue: Revenue;
  monthlySeries: BarPoint[];
  donutData: DonutSlice[];
  recentDevis: RecentDevis[];
  upcomingTasks: UpcomingTask[];
  featuredEmployee: Featured;
};

export function OverviewClient({
  role,
  fullName,
  counts,
  revenue,
  monthlySeries,
  donutData,
  recentDevis,
  upcomingTasks,
  featuredEmployee,
}: Props) {
  const { t } = useI18n();
  const isAdmin = role === "admin";

  const subtitle =
    role === "admin"
      ? t.dashboard.admin.title
      : role === "worker"
        ? t.dashboard.worker.title
        : t.dashboard.freelancer.title;

  return (
    <div className="space-y-7">
      <Greeting fullName={fullName} subtitle={subtitle} role={role} />

      {isAdmin && (
        <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-4">
          <HeroRevenueCard
            mtdPaid={revenue.mtdPaid}
            mtdInvoiced={revenue.mtdInvoiced}
            paidTrend={revenue.paidTrend}
          />

          <KpiCard
            label={t.kpis.invoicedMonth}
            value={revenue.mtdInvoiced}
            currency
            trend={revenue.invoicedTrend}
            tone="brand"
            trendSuffix={t.kpis.vsLastMonth}
            subStat="Billed this month"
            icon={
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M9 13h6 M9 17h6" />
            }
          />
          <KpiCard
            label={t.kpis.outstanding}
            value={revenue.outstanding}
            currency
            trend={revenue.outstandingTrend}
            invertTrend
            tone="amber"
            trendSuffix={t.kpis.vsLastMonth}
            subStat={
              revenue.mtdInvoiced > 0
                ? `${Math.round((revenue.outstanding / revenue.mtdInvoiced) * 100)}% of invoiced unpaid`
                : "Awaiting payment"
            }
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </>
            }
          />
          <KpiCard
            label={t.kpis.activeProjects}
            value={counts.activeProjects}
            tone="ink"
            subStat={
              counts.clients !== null
                ? `${counts.clients} client${counts.clients === 1 ? "" : "s"} · ${counts.activeTasks} open task${counts.activeTasks === 1 ? "" : "s"}`
                : `${counts.activeTasks} open tasks`
            }
            icon={
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            }
          />
        </section>
      )}

      {!isAdmin && (
        <>
          <section className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
            <KpiCard
              label={t.kpis.myActiveTasks}
              value={counts.myActiveTasks}
              tone="brand"
              icon={<path d="M3 6h2l1 2h13M3 12h18M3 18h18" />}
            />
            <KpiCard
              label={t.kpis.overdue}
              value={counts.myOverdueTasks}
              tone={counts.myOverdueTasks > 0 ? "amber" : "ink"}
              icon={
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </>
              }
            />
            <KpiCard
              label={t.kpis.activeProjects}
              value={counts.activeProjects}
              tone="ink"
              icon={
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              }
            />
            {counts.clients !== null && (
              <KpiCard
                label={t.kpis.clients}
                value={counts.clients}
                icon={
                  <>
                    <circle cx="9" cy="8" r="3.5" />
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  </>
                }
              />
            )}
          </section>

          <section className="grid grid-cols-1 gap-5">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t.overview.myTasks}</CardTitle>
                  <Link
                    href="/dashboard/tasks"
                    className="text-xs font-semibold text-brand hover:text-brand-dark"
                  >
                    {t.overview.seeAll}
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <MyTasksList rows={upcomingTasks} />
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {isAdmin && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.overview.revenue12}</CardTitle>
                <Link
                  href="/dashboard/finance"
                  className="text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  {t.overview.financeDetails}
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlyBars series={monthlySeries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.overview.serviceMix}</CardTitle>
              <p className="text-xs text-ink/50">
                {t.overview.serviceMixHint}
              </p>
            </CardHeader>
            <CardContent>
              {donutData.length > 0 ? (
                <div className="space-y-4">
                  <Donut data={donutData} size={180} thickness={20} />
                  <DonutLegend data={donutData.slice(0, 5)} />
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-ink/50">
                  {t.overview.noServiceMix}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {featuredEmployee && (
        <FeaturedCard featured={featuredEmployee} canEdit={isAdmin} />
      )}

      {isAdmin && !featuredEmployee && <FeaturedEmptyCta />}

      {isAdmin && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.overview.recentActivity}</CardTitle>
                <Link
                  href="/dashboard/devis"
                  className="text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  {t.overview.seeAll}
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <RecentDevisFeed rows={recentDevis} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.overview.upcoming}</CardTitle>
                <Link
                  href="/dashboard/tasks"
                  className="text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  {t.overview.seeAll}
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <UpcomingTasksList rows={upcomingTasks} />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function Greeting({
  fullName,
  subtitle,
  role,
}: {
  fullName: string;
  subtitle: string;
  role: AnyUserRole;
}) {
  const { t } = useI18n();
  const hour = new Date().getHours();
  const time =
    hour < 5
      ? t.greeting.goodNight
      : hour < 12
        ? t.greeting.goodMorning
        : hour < 18
          ? t.greeting.goodAfternoon
          : t.greeting.goodEvening;

  return (
    <section className="reveal flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
        {role === "admin"
          ? t.greeting.spaceAdmin
          : role === "worker"
            ? t.greeting.spaceTeam
            : t.greeting.spaceFreelance}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        {time}, {fullName.split(" ")[0]} 👋
      </h1>
      <p className="text-sm text-ink/55">{subtitle}</p>
    </section>
  );
}
