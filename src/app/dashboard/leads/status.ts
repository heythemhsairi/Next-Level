import type { LeadStatus } from "./actions";

type Tone = "neutral" | "amber" | "violet" | "green" | "red";

export const LEAD_STATUS_ORDER: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = {
  new: "neutral",
  contacted: "amber",
  qualified: "violet",
  won: "green",
  lost: "red",
};

export function formatLeadValue(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("en-US")} DT`;
}
