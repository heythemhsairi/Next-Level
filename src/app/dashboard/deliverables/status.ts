import type { DeliverableStatus } from "./actions";

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

export const STATUS_ORDER: DeliverableStatus[] = [
  "draft",
  "in_review",
  "approved",
  "delivered",
  "revision_requested",
];

export const STATUS_LABEL: Record<DeliverableStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  delivered: "Delivered",
  revision_requested: "Revision requested",
};

export const STATUS_TONE: Record<DeliverableStatus, BadgeTone> = {
  draft: "neutral",
  in_review: "amber",
  approved: "violet",
  delivered: "green",
  revision_requested: "red",
};
