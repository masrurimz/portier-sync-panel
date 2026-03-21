import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

import type { ReviewItem } from "../../-domain/review";

/**
 * Return the visual state indicator for a review item.
 * Conflict items are pending (orange) until explicitly resolved (green).
 * Safe items are green when included, muted when excluded.
 */
export function getItemIndicator(item: ReviewItem) {
  if (!item.resolution.kind) {
    return { Icon: AlertTriangleIcon, color: "text-amber-500", label: "Pending" } as const;
  }
  if (item.resolution.kind === "local") {
    return { Icon: CheckCircle2Icon, color: "text-muted-foreground", label: "Keep current" } as const;
  }
  if (item.resolution.kind === "external") {
    return { Icon: CheckCircle2Icon, color: "text-emerald-500", label: "Accept incoming" } as const;
  }
  return { Icon: CheckCircle2Icon, color: "text-blue-500", label: "Custom" } as const;
}
