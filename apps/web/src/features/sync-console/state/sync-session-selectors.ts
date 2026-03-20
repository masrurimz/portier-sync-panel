import type { Integration, IntegrationId } from "@portier-sync/api";
import { buildIntegrationMetrics, buildOverviewMetrics, getPriorityIntegrations, integrationHealthSeed } from "../domain/integration";
import { conflictItems, getPreviewLines, selectedItems, type ReviewBatch } from "../domain/review";
import type { ConsoleMetric } from "../domain/integration";
import type { SyncFetchError } from "../api/sync-preview";

export function selectOverviewMetrics(integrations: Integration[]): ConsoleMetric[] {
  return buildOverviewMetrics(integrations);
}

export function selectPriorityIntegrations(integrations: Integration[]) {
  return getPriorityIntegrations(integrations);
}

export function selectPendingReviewCount(batch: ReviewBatch) {
  return selectedItems(batch.items).length;
}

export function selectPreviewLines(batch: ReviewBatch) {
  return getPreviewLines(batch);
}

export function selectConflictCount(batch: ReviewBatch) {
  return conflictItems(batch.items).length;
}

export function selectIntegrationMetrics({
  integration,
  batch,
  integrationId,
  error,
}: {
  integration: Integration;
  batch: ReviewBatch;
  integrationId: IntegrationId;
  error: SyncFetchError | null;
}) {
  return buildIntegrationMetrics({
    integration,
    pendingUpdates: selectPendingReviewCount(batch),
    conflicts: selectConflictCount(batch),
    health: integrationHealthSeed[integrationId],
    hasFetchError: Boolean(error),
  });
}
