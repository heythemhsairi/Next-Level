import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TimelineItem = {
  id: string;
  title: string;
  project: string | null;
  date: string; // ISO
};

function relativeLabel(iso: string): { text: string; soon: boolean; overdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d ago`, soon: false, overdue: true };
  if (days === 0) return { text: "Today", soon: true, overdue: false };
  if (days === 1) return { text: "Tomorrow", soon: true, overdue: false };
  if (days <= 7) return { text: `In ${days} days`, soon: true, overdue: false };
  return { text: `In ${days} days`, soon: false, overdue: false };
}

function dayMonth(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

/**
 * "What's coming" — the client-meaningful calendar: upcoming work with due
 * dates, as a clean date-chip timeline. Warm placeholder when nothing is
 * scheduled.
 */
export function UpcomingTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What's coming</CardTitle>
        <p className="text-xs text-ink/50">Upcoming milestones on your work</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/12 text-xl">
              🗓️
            </span>
            <p className="text-sm font-medium text-ink/80">Nothing scheduled yet</p>
            <p className="max-w-xs text-xs text-ink/45">
              Upcoming deliveries and milestones will show up here so you always
              know what's next.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => {
              const { day, month } = dayMonth(it.date);
              const rel = relativeLabel(it.date);
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <span className="text-base font-display font-extrabold leading-none text-ink tabular-nums">
                      {day}
                    </span>
                    <span className="text-[9px] font-bold tracking-wider text-ink/45">
                      {month}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {it.title}
                    </p>
                    {it.project && (
                      <p className="truncate text-xs text-ink/45">{it.project}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      rel.overdue
                        ? "bg-brand/15 text-brand-light"
                        : rel.soon
                          ? "bg-brand/12 text-brand"
                          : "bg-white/[0.06] text-ink/55"
                    }`}
                  >
                    {rel.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
