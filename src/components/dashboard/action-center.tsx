import Link from "next/link";

export type ActionItem = {
  label: string;
  count: number;
  href: string;
  /** higher = more urgent (controls accent). */
  urgent?: boolean;
  icon: React.ReactNode;
};

/**
 * Action-focused control center: surfaces what needs the team's attention
 * right now (overdue invoices, deliverables awaiting client review, revision
 * requests, tasks due, …). Each tile links straight to where you act on it.
 */
export function ActionCenter({ items }: { items: ActionItem[] }) {
  const active = items.filter((i) => i.count > 0);

  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
            </svg>
          </span>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Needs your attention
          </h2>
        </div>
        {active.length === 0 && (
          <span className="text-xs font-medium text-emerald-400">
            All clear ✓
          </span>
        )}
      </div>

      {active.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink/45">
          Nothing needs action right now. Nice work.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {active.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4 transition-all duration-200",
                item.urgent
                  ? "border-brand/30 bg-brand/[0.07] hover:border-brand/60 hover:bg-brand/[0.12]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  item.urgent
                    ? "bg-brand/20 text-brand-light"
                    : "bg-white/8 text-ink/70",
                ].join(" ")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
              </span>
              <span className="text-2xl font-bold leading-none text-ink">
                {item.count}
              </span>
              <span className="text-xs leading-tight text-ink/55">
                {item.label}
              </span>
              <span className="absolute right-3 top-3 text-ink/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink/50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14 M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
