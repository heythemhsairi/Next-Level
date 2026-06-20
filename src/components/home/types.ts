// Shared types + tone maps for the dashboard home command centers.
// Lifted from overview-client.tsx so admin/sales/editor homes share one vocabulary.

export type Counts = {
  activeProjects: number;
  activeTasks: number;
  teamSize: number | null;
  clients: number | null;
  myActiveTasks: number;
  myOverdueTasks: number;
};

export type Revenue = {
  mtdInvoiced: number;
  mtdPaid: number;
  outstanding: number;
  invoicedTrend: number | null;
  paidTrend: number | null;
  outstandingTrend: number | null;
};

export type Featured = {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  reason: string | null;
  month: string;
} | null;

export type RecentDevis = {
  id: string;
  kind: "devis" | "facture";
  devis_number: number;
  total_dt: number;
  status: string;
  payment_status: string;
  date: string;
  client_name: string;
};

export type UpcomingTask = {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  status: string;
  project: string;
  client: string;
  assignee: { name: string; avatar: string | null } | null;
};

export const statusTone: Record<string, "slate" | "blue" | "green" | "red"> = {
  draft: "slate",
  sent: "blue",
  accepted: "green",
  rejected: "red",
};

export const priorityTone: Record<
  string,
  "slate" | "neutral" | "amber" | "red"
> = {
  low: "slate",
  normal: "neutral",
  high: "amber",
  urgent: "red",
};

export const myStatusTone: Record<
  string,
  "slate" | "blue" | "amber" | "green"
> = {
  todo: "slate",
  in_progress: "blue",
  review: "amber",
  done: "green",
};

export function formatMonth(
  monthIso: string,
  months: readonly string[],
): string {
  const [y, m] = monthIso.split("-").map(Number);
  const monthName = months[(m ?? 1) - 1] ?? "";
  return `${monthName} ${y}`;
}

/** Percent trend helper shared by the home command centers. */
export function pctTrend(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return ((current - prev) / prev) * 100;
}
