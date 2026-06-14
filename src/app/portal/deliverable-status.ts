// Standalone status labels/tones for the client portal (no server imports).
export type DeliverableStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "delivered"
  | "revision_requested";

type BadgeTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "slate"
  | "accent"
  | "ink";

// Clients see friendly, outcome-focused labels.
export const DELIVERABLE_STATUS_LABEL: Record<DeliverableStatus, string> = {
  draft: "In production",
  in_review: "In review",
  approved: "Approved",
  delivered: "Delivered",
  revision_requested: "Revising",
};

export const DELIVERABLE_STATUS_TONE: Record<DeliverableStatus, BadgeTone> = {
  draft: "neutral",
  in_review: "amber",
  approved: "violet",
  delivered: "green",
  revision_requested: "amber",
};
