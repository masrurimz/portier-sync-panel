import type { AuditEntry } from '../schema/index';
import type { LocalSnapshotRecord } from '../msw/data/local-snapshots';

export interface ApplyLocalReviewInput {
  integrationId: string;
  proposedVersion: string;
  selectedCount: number;
  conflictResolutionCount: number;
  applicationName: string;
}

export interface ApplyLocalReviewResult {
  snapshot: LocalSnapshotRecord;
  auditEntry: AuditEntry;
}

// Fetch the current local snapshot for one integration.
// Calls the MSW-backed local endpoint; throws on HTTP error.
export async function getLocalSnapshot(integrationId: string): Promise<LocalSnapshotRecord> {
  const res = await fetch(`/local/integrations/${integrationId}/snapshot`);
  if (!res.ok) {
    throw new Error(`getLocalSnapshot failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: LocalSnapshotRecord };
  return json.data;
}

// Apply an operator-reviewed draft to the local DB.
// Updates the local snapshot version and appends a local audit entry.
export async function applyLocalReview(
  input: ApplyLocalReviewInput,
): Promise<ApplyLocalReviewResult> {
  const res = await fetch(`/local/integrations/${input.integrationId}/apply-review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proposedVersion: input.proposedVersion,
      selectedCount: input.selectedCount,
      conflictResolutionCount: input.conflictResolutionCount,
      applicationName: input.applicationName,
    }),
  });
  if (!res.ok) {
    throw new Error(`applyLocalReview failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: ApplyLocalReviewResult };
  return json.data;
}

// Fetch local audit history, optionally filtered by integrationId.
export async function getLocalHistory(integrationId?: string): Promise<AuditEntry[]> {
  const url = integrationId
    ? `/local/history?integrationId=${encodeURIComponent(integrationId)}`
    : '/local/history';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`getLocalHistory failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: AuditEntry[] };
  return json.data;
}

// Re-export the type for consumers
export type { LocalSnapshotRecord };