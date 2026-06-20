export function formatDevisNumber(n: number, kind: "devis" | "facture" = "devis"): string {
  const prefix = kind === "facture" ? "FACT" : "EST";
  return `${prefix}-${String(n).padStart(7, "0")}`;
}

export function formatDt(value: number): string {
  return `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DT`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Monday-based start of the week for `ref` (default: now), at 00:00 local.
 * Used by the momentum layer for "this week" counts.
 */
export function startOfWeek(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}
