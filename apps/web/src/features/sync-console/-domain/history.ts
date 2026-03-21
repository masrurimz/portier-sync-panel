import type { SyncHistoryEntry, IntegrationId, AuditEntry } from '@portier-sync/api';
import type { ReviewItem } from './review.js';

export function buildAppliedHistoryEntry({
  integrationId,
  version,
  reviewedItems,
}: {
  integrationId: IntegrationId;
  version: string;
  reviewedItems: ReviewItem[];
}): SyncHistoryEntry {
  const kept = reviewedItems.filter((item) => item.resolution.kind === "local").length;
  const accepted = reviewedItems.filter((item) => item.resolution.kind === "external").length;
  return {
    id: `hist-${integrationId}-${Date.now()}`,
    integrationId,
    timestamp: new Date(),
    source: "user",
    version,
    summary: `Manual review applied — ${kept} kept current, ${accepted} accepted incoming`,
    details: `${reviewedItems.length} field decisions applied after operator review.`,
    changesCount: reviewedItems.length,
    addedCount: reviewedItems.filter((item) => item.changeType === "ADD").length,
    updatedCount: reviewedItems.filter((item) => item.changeType === "UPDATE").length,
    deletedCount: reviewedItems.filter((item) => item.changeType === "DELETE").length,
  };
}

// Convert a remote-origin SyncHistoryEntry to a provenance-aware AuditEntry
// for unified timeline rendering. Never call this on locally-applied entries.
export function remoteHistoryToAuditEntry(entry: SyncHistoryEntry): AuditEntry {
  return {
    id: entry.id,
    integrationId: entry.integrationId,
    origin: 'remote',
    eventType: 'remote-history',
    summary: entry.summary,
    details: entry.details,
    timestamp: entry.timestamp,
    resultVersion: entry.version,
  };
}