import { $fetch } from '../client';
import type { AuditEntry } from '../schema/index';
import type { LocalSnapshot, ApplyReviewBody } from '../schema/index';

export interface ApplyLocalReviewInput {
  integrationId: string;
  expectedRevision: number; // CAS token: the revision client read at fetch time
  selectedCount: number;
  conflictResolutionCount: number;
  applicationName: string;
}

export interface ApplyLocalReviewResult {
  snapshot: LocalSnapshot;
  auditEntry: AuditEntry;
}

// Fetch the current local snapshot for one integration.
export async function getLocalSnapshot(integrationId: string): Promise<LocalSnapshot> {
  const result = await $fetch('@get/api/v1/integrations/:id/snapshot', {
    params: { id: integrationId },
  });
  return result.data;
}

// Apply an operator-reviewed draft to the local DB.
// Updates the local snapshot revision and appends a local audit entry.
// Throws on HTTP error; throws with a distinct message on 409 (stale revision).
export async function applyLocalReview(
  input: ApplyLocalReviewInput,
): Promise<ApplyLocalReviewResult> {
  const body: ApplyReviewBody = {
    expectedRevision: input.expectedRevision,
    selectedCount: input.selectedCount,
    conflictResolutionCount: input.conflictResolutionCount,
    applicationName: input.applicationName,
  };
  const result = await $fetch('@put/api/v1/integrations/:id/apply-review', {
    params: { id: input.integrationId },
    body,
  });
  return result.data;
}

// Fetch local audit history for one integration.
export async function getLocalHistory(integrationId: string): Promise<AuditEntry[]> {
  const result = await $fetch('@get/api/v1/integrations/:id/audit', {
    params: { id: integrationId },
  });
  return result.data;
}

// Re-export types for consumers
export type { LocalSnapshot as LocalSnapshotRecord };