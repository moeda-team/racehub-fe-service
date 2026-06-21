import type { EventStatus } from "./types.gen";

type BadgeVariant = "ok" | "warn" | "danger" | "neutral" | "flame" | "sprint";

interface StatusDisplay {
  label: string;
  variant: BadgeVariant;
}

/**
 * Maps an event status to its Indonesian label and Badge variant.
 * Display-only — the backend is authoritative for status transitions.
 */
export function eventStatusDisplay(status: EventStatus): StatusDisplay {
  switch (status) {
    case "draft":
      return { label: "Draft", variant: "neutral" };
    case "published":
      return { label: "Terbit", variant: "ok" };
    case "cancelled":
      return { label: "Dibatalkan", variant: "danger" };
    case "finished":
      return { label: "Selesai", variant: "sprint" };
    default:
      return { label: status, variant: "neutral" };
  }
}
