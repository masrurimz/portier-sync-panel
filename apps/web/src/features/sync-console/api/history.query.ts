import {
  historyKeys,
  historyListQueryOptions as apiHistoryListQueryOptions,
} from "@portier-sync/api";
import type { SyncHistoryEntry } from "@portier-sync/api";

// Re-export query key factory under legacy name for backwards compatibility.
export const integrationHistoryQueryKey = (id: string) => historyKeys.list(id);

// Query options for integration history.
// Adapts the new signature `{ input: { id } }` to the legacy `id` parameter.
export function integrationHistoryQueryOptions(id: string) {
  return apiHistoryListQueryOptions({ input: { id } });
}

// Re-export types used by callers.
export type { SyncHistoryEntry };