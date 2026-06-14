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
