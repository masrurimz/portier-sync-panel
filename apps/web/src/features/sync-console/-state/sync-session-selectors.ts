import { pendingItems, getPreviewLines, type DraftSession } from "../-domain/review";

export function selectPendingReviewCount(batch: DraftSession | undefined): number {
  return batch ? pendingItems(batch.items).length : 0;
}

export function selectPreviewLines(batch: DraftSession | undefined): string[] {
  return batch ? getPreviewLines(batch) : [];
}