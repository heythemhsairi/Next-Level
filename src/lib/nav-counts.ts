import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AnyUserRole } from "@/lib/utils";

/** Live counts rendered as badges next to sidebar items. */
export type NavCounts = {
  /** My open tasks due today or overdue (editor/admin). */
  myTasksDue: number;
  /** Deliverables awaiting review (editor/admin). */
  deliverablesInReview: number;
  /** Unpaid factures (admin/sales). */
  unpaidFactures: number;
  /** New, untouched leads (admin/sales). */
  newLeads: number;
};

const EMPTY: NavCounts = {
  myTasksDue: 0,
  deliverablesInReview: 0,
  unpaidFactures: 0,
  newLeads: 0,
};

async function count(
  fn: () => Promise<number>,
  label: string,
): Promise<number> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[nav-counts:${label}]`, err);
    return 0;
  }
}

/**
 * Role-gated sidebar badge counts. Each role only triggers the queries it
 * actually needs, so editors never hit finance tables and sales never hits
 * deliverables. All failures degrade to 0 (badge simply doesn't render).
 */
export async function getNavCounts(
  role: AnyUserRole,
  userId: string,
): Promise<NavCounts> {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const isAdmin = role === "admin";
  const isEditor = role === "editor" || role === "worker" || role === "freelancer";
  const isSales = role === "sales";
  const seesWork = isAdmin || isEditor;
  const seesMoney = isAdmin || isSales;

  const [myTasksDue, deliverablesInReview, unpaidFactures, newLeads] =
    await Promise.all([
      seesWork
        ? count(async () => {
            const { count: c } = await supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("assignee_id", userId)
              .in("status", ["todo", "in_progress", "review"])
              .lte("deadline", todayIso)
              .is("parent_task_id", null);
            return c ?? 0;
          }, "myTasksDue")
        : Promise.resolve(0),
      seesWork
        ? count(async () => {
            const { count: c } = await supabase
              .from("deliverables")
              .select("id", { count: "exact", head: true })
              .eq("status", "in_review");
            return c ?? 0;
          }, "deliverablesInReview")
        : Promise.resolve(0),
      seesMoney
        ? count(async () => {
            const { count: c } = await supabase
              .from("devis")
              .select("id", { count: "exact", head: true })
              .eq("kind", "facture")
              .neq("payment_status", "paid")
              .neq("status", "draft");
            return c ?? 0;
          }, "unpaidFactures")
        : Promise.resolve(0),
      seesMoney
        ? count(async () => {
            const { count: c } = await supabase
              .from("leads")
              .select("id", { count: "exact", head: true })
              .eq("status", "new");
            return c ?? 0;
          }, "newLeads")
        : Promise.resolve(0),
    ]);

  return { ...EMPTY, myTasksDue, deliverablesInReview, unpaidFactures, newLeads };
}
