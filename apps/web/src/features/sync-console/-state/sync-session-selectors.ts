import type { Integration } from "@portier-sync/api";
import { buildIntegrationMetrics, buildOverviewMetrics, getPriorityIntegrations } from "../-domain/integration";
import { pendingItems, getPreviewLines, type DraftSession } from "../-domain/review";
import type { ConsoleMetric } from "../-domain/integration";
import type { SyncFetchError } from "../-domain/errors";

export function selectOverviewMetrics(integrations: Integration[]): ConsoleMetric[] {
  return buildOverviewMetrics(integrations);
}

export function selectPriorityIntegrations(integrations: Integration[]) {
  return getPriorityIntegrations(integrations);
}

export function selectPendingReviewCount(batch: DraftSession | undefined): number {
  return batch ? pendingItems(batch.items).length : 0;
}

export function selectPreviewLines(batch: DraftSession | undefined): string[] {
  return batch ? getPreviewLines(batch) : [];
}

export function selectPendingCount(batch: DraftSession | undefined): number {
  return batch ? pendingItems(batch.items).length : 0;
}

export function selectIntegrationMetrics({
  integration,
  batch,
  error,
}: {
  integration: Integration;
  batch: DraftSession | undefined;
  error: SyncFetchError | null;
}): ConsoleMetric[] {
  return buildIntegrationMetrics({
    integration,
    pendingUpdates: selectPendingReviewCount(batch),
    conflicts: selectPendingCount(batch),
    hasFetchError: Boolean(error),
  });
}