import type { Integration, IntegrationId } from "@portier-sync/api";
import { buildIntegrationMetrics, buildOverviewMetrics, getPriorityIntegrations, integrationHealthSeed } from "../-domain/integration";
import { conflictItems, getPreviewLines, selectedItems, type ReviewBatch } from "../-domain/review";
import type { ConsoleMetric } from "../-domain/integration";
import type { SyncFetchError } from "../-api/sync-preview";

export function selectOverviewMetrics(integrations: Integration[]): ConsoleMetric[] {
  return buildOverviewMetrics(integrations);
}

export function selectPriorityIntegrations(integrations: Integration[]) {
  return getPriorityIntegrations(integrations);
}

export function selectPendingReviewCount(batch: ReviewBatch | undefined): number {
  return batch ? selectedItems(batch.items).length : 0;
}

export function selectPreviewLines(batch: ReviewBatch | undefined): string[] {
  return batch ? getPreviewLines(batch) : [];
}

export function selectConflictCount(batch: ReviewBatch | undefined): number {
  return batch ? conflictItems(batch.items).length : 0;
}

export function selectIntegrationMetrics({
  integration,
  batch,
  integrationId,
  error,
}: {
  integration: Integration;
  batch: ReviewBatch | undefined;
  integrationId: IntegrationId;
  error: SyncFetchError | null;
}): ConsoleMetric[] {
  const health = integrationHealthSeed[integrationId] ?? {
    reliability: "Status unknown",
    sourceHealth: "healthy" as const,
    auditRetention: "—",
    nextScheduledSync: "—",
  };

  return buildIntegrationMetrics({
    integration,
    pendingUpdates: selectPendingReviewCount(batch),
    conflicts: selectConflictCount(batch),
    health,
    hasFetchError: Boolean(error),
  });
}