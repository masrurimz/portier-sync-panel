import { AlertTriangleIcon, CheckCircle2Icon, CircleIcon } from 'lucide-react';
import type { ReviewItem } from '../../domain/review';

/**
 * Return the visual state indicator for a review item.
 * Conflict items are pending (orange) until explicitly resolved (green).
 * Safe items are green when included, muted when excluded.
 */
export function getItemIndicator(item: ReviewItem) {
  if (item.conflict && !item.resolution.kind) {
    return { Icon: AlertTriangleIcon, color: 'text-amber-500', label: 'Needs decision' } as const;
  }
  if (item.conflict) {
    return { Icon: CheckCircle2Icon, color: 'text-emerald-500', label: 'Resolved' } as const;
  }
  if (item.selected) {
    return { Icon: CheckCircle2Icon, color: 'text-emerald-500', label: 'Approved' } as const;
  }
  return { Icon: CircleIcon, color: 'text-muted-foreground', label: 'Skipped' } as const;
}