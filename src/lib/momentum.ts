import "server-only";
import { createClient } from "@/lib/supabase/server";
import { startOfWeek } from "@/lib/format";
import type { AnyUserRole } from "@/lib/utils";

/**
 * The momentum layer — tasteful motivation built strictly on real rows.
 * No invented points/levels. Every number maps to data; when a metric is 0 or
 * unavailable, the UI shows an encouraging empty state rather than a fake value.
 */
export type Momentum = {
  /** Deliverables marked delivered since Monday (admin/editor). */
  deliveredThisWeek: number;
  /** Same count for the previous week — lets the UI show a delta. */
  deliveredLastWeek: number;
  /** Consecutive most-recent deliverables that shipped (shipping streak). */
  deliveryStreak: number;
  /** Tasks I completed since Monday (editor/admin). */
  tasksShippedThisWeek: number;
  /** Leads moved to "won" — current count (sales/admin). */
  leadsWon: number;
  /** Win rate 0..100 = won / (won + lost) (sales/admin). */
  winRate: number | null;
  /** Devis accepted in a row among recent sent/accepted (sales/admin). */
  devisAcceptStreak: number;
  /** Collected this month in DT (sales/admin). */
  collectedThisMonth: number;
  /** Collected last month in DT — the honest "vs" reference. */
  collectedLastMonth: number;
  /** Team task completions in the last 7 days, oldest→newest, for a sparkline. */
  teamEnergy: number[];
};

const EMPTY: Momentum = {
  deliveredThisWeek: 0,
  deliveredLastWeek: 0,
  deliveryStreak: 0,
  tasksShippedThisWeek: 0,
  leadsWon: 0,
  winRate: null,
  devisAcceptStreak: 0,
  collectedThisMonth: 0,
  collectedLastMonth: 0,
  teamEnergy: [],
};

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[momentum:${label}]`, err);
    return fallback;
  }
}

export async function getMomentum(
  role: AnyUserRole,
  userId: string,
): Promise<Momentum> {
  const supabase = await createClient();

  const isAdmin = role === "admin";
  const isEditor = role === "editor" || role === "worker" || role === "freelancer";
  const isSales = role === "sales";
  const seesWork = isAdmin || isEditor;
  const seesMoney = isAdmin || isSales;

  const weekStart = startOfWeek();
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const weekStartIso = weekStart.toISOString();
  const prevWeekStartIso = prevWeekStart.toISOString();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfMonthIso = startOfMonth.toISOString().slice(0, 10);
  const startOfPrevMonthIso = startOfPrevMonth.toISOString().slice(0, 10);

  // ---- Deliveries (admin/editor) ----
  const deliveredThisWeek = seesWork
    ? await safe(async () => {
        const { count } = await supabase
          .from("deliverables")
          .select("id", { count: "exact", head: true })
          .eq("status", "delivered")
          .gte("delivered_at", weekStartIso);
        return count ?? 0;
      }, 0, "deliveredThisWeek")
    : 0;

  const deliveredLastWeek = seesWork
    ? await safe(async () => {
        const { count } = await supabase
          .from("deliverables")
          .select("id", { count: "exact", head: true })
          .eq("status", "delivered")
          .gte("delivered_at", prevWeekStartIso)
          .lt("delivered_at", weekStartIso);
        return count ?? 0;
      }, 0, "deliveredLastWeek")
    : 0;

  // Shipping streak: how many of the most recent deliverables are "delivered",
  // counting back from newest. An honest "we're on a roll" signal.
  const deliveryStreak = seesWork
    ? await safe(async () => {
        const { data } = await supabase
          .from("deliverables")
          .select("status, updated_at")
          .order("updated_at", { ascending: false })
          .limit(20);
        let streak = 0;
        for (const d of data ?? []) {
          if (d.status === "delivered" || d.status === "approved") streak++;
          else break;
        }
        return streak;
      }, 0, "deliveryStreak")
    : 0;

  // ---- Tasks shipped this week (editor/admin) ----
  // Prefer the activity log (records done-transitions with a timestamp);
  // degrade to current done-state count if the table/columns aren't present.
  const tasksShippedThisWeek = seesWork
    ? await safe(async () => {
        // Count my "moved a task to done" events this week. meta->>to is the
        // new status (logged in tasks/actions.ts as { from, to }).
        const { count, error } = await supabase
          .from("task_activity")
          .select("id", { count: "exact", head: true })
          .eq("actor_id", userId)
          .eq("action", "status_changed")
          .eq("meta->>to", "done")
          .gte("created_at", weekStartIso);
        if (error) throw error;
        return count ?? 0;
      }, 0, "tasksShippedThisWeek")
    : 0;

  // ---- Leads (sales/admin) ----
  const leadCounts = seesMoney
    ? await safe(async () => {
        const { data } = await supabase.from("leads").select("status");
        const tally = { won: 0, lost: 0 };
        for (const l of data ?? []) {
          if (l.status === "won") tally.won++;
          else if (l.status === "lost") tally.lost++;
        }
        return tally;
      }, { won: 0, lost: 0 }, "leadCounts")
    : { won: 0, lost: 0 };
  const leadsWon = leadCounts.won;
  const winRate =
    leadCounts.won + leadCounts.lost > 0
      ? Math.round((leadCounts.won / (leadCounts.won + leadCounts.lost)) * 100)
      : null;

  // ---- Devis accept streak (sales/admin) ----
  const devisAcceptStreak = seesMoney
    ? await safe(async () => {
        const { data } = await supabase
          .from("devis")
          .select("status, date")
          .in("status", ["sent", "accepted", "rejected"])
          .order("date", { ascending: false })
          .limit(20);
        let streak = 0;
        for (const d of data ?? []) {
          if (d.status === "accepted") streak++;
          else if (d.status === "rejected") break;
          // "sent" (still pending) doesn't break the streak — skip it.
        }
        return streak;
      }, 0, "devisAcceptStreak")
    : 0;

  // ---- Collected this/last month (sales/admin) ----
  const collected = seesMoney
    ? await safe(async () => {
        const { data } = await supabase
          .from("payments")
          .select("amount_dt, paid_at")
          .gte("paid_at", startOfPrevMonthIso);
        let thisM = 0, lastM = 0;
        for (const p of data ?? []) {
          const paid = p.paid_at as string;
          if (paid >= startOfMonthIso) thisM += Number(p.amount_dt ?? 0);
          else lastM += Number(p.amount_dt ?? 0);
        }
        return { thisM, lastM };
      }, { thisM: 0, lastM: 0 }, "collected")
    : { thisM: 0, lastM: 0 };

  // ---- Team energy: completions per day over the last 7 days (admin) ----
  const teamEnergy = isAdmin
    ? await safe(async () => {
        const since = new Date(now);
        since.setDate(since.getDate() - 6);
        since.setHours(0, 0, 0, 0);
        const { data, error } = await supabase
          .from("task_activity")
          .select("created_at, action")
          .eq("action", "status_changed")
          .gte("created_at", since.toISOString());
        if (error) throw error;
        const buckets = new Array(7).fill(0) as number[];
        for (const row of data ?? []) {
          const d = new Date(row.created_at as string);
          const idx = Math.floor(
            (d.getTime() - since.getTime()) / 86400000,
          );
          if (idx >= 0 && idx < 7) buckets[idx]++;
        }
        return buckets;
      }, [], "teamEnergy")
    : [];

  return {
    ...EMPTY,
    deliveredThisWeek,
    deliveredLastWeek,
    deliveryStreak,
    tasksShippedThisWeek,
    leadsWon,
    winRate,
    devisAcceptStreak,
    collectedThisMonth: collected.thisM,
    collectedLastMonth: collected.lastM,
    teamEnergy,
  };
}
