import type { SyncHistoryEntry, IntegrationId } from '@portier-sync/api';
import type { ReviewItem } from './review.js';

export function buildAppliedHistoryEntry({
  integrationId,
  version,
  selectedItems,
}: {
  integrationId: IntegrationId;
  version: string;
  selectedItems: ReviewItem[];
}): SyncHistoryEntry {
  const conflicts = selectedItems.filter((item) => item.conflict).length;
  return {
    id: `hist-${integrationId}-${Date.now()}`,
    integrationId,
    timestamp: new Date(),
    source: "user",
    version,
    summary: `Manual review applied${conflicts > 0 ? ` with ${conflicts} conflict resolution${conflicts > 1 ? "s" : ""}` : ""}`,
    details: `${selectedItems.length} selected field${selectedItems.length === 1 ? "" : "s"} were applied after operator review.`,
    changesCount: selectedItems.length,
    addedCount: selectedItems.filter((item) => item.changeType === "ADD").length,
    updatedCount: selectedItems.filter((item) => item.changeType === "UPDATE").length,
    deletedCount: selectedItems.filter((item) => item.changeType === "DELETE").length,
  };
}