import type { SyncHistoryEntry, AuditEntry } from '@portier-sync/api';

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