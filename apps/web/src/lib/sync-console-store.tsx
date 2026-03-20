import { useMemo } from "react";

import type { ApplicationId } from "./api-types";
import { integrationHealthSeed, type ConsoleMetric } from "../features/sync-console/domain/integration";
import type { ReviewItem, ReviewResolution } from "../features/sync-console/domain/review";
import { useSyncSession } from "../features/sync-console/state/sync-session-provider";
import {
  selectConflictCount,
  selectIntegrationMetrics,
  selectOverviewMetrics,
  selectPendingReviewCount,
  selectPriorityIntegrations,
  selectPreviewLines,
} from "../features/sync-console/state/sync-session-selectors";

export type { ConsoleMetric, ReviewItem, ReviewResolution };

export function useSyncConsole() {
  const session = useSyncSession();

  return useMemo(
    () => ({
      integrations: session.integrations,
      healthByIntegration: integrationHealthSeed,
      historyByIntegration: session.historyByIntegration,
      reviewBatches: session.reviewBatches,
      syncErrors: session.syncErrors,
      syncingId: session.syncingId,
      getIntegrationMetrics: (integrationId: ApplicationId) =>
        selectIntegrationMetrics({
          integration: session.integrations.find((item) => item.id === integrationId)!,
          batch: session.reviewBatches[integrationId],
          integrationId,
          error: session.syncErrors[integrationId] ?? null,
        }),
      getOverviewMetrics: () => selectOverviewMetrics(session.integrations),
      getPriorityIntegrations: () => selectPriorityIntegrations(session.integrations),
      getPendingReviewCount: (integrationId: ApplicationId) => selectPendingReviewCount(session.reviewBatches[integrationId]),
      getDetailPreviewLines: (integrationId: ApplicationId) => selectPreviewLines(session.reviewBatches[integrationId]),
      getReviewBatch: (integrationId: ApplicationId) => session.reviewBatches[integrationId],
      getIntegrationHistory: (integrationId: ApplicationId) => session.historyByIntegration[integrationId],
      getSyncError: (integrationId: ApplicationId) => session.syncErrors[integrationId] ?? null,
      getConflictCount: (integrationId: ApplicationId) => selectConflictCount(session.reviewBatches[integrationId]),
      syncNow: session.syncNow,
      updateReviewDecision: session.updateReviewDecision,
      toggleReviewSelection: session.toggleReviewSelection,
      approveSafeChanges: session.approveSafeChanges,
      applyReview: session.applyReview,
    }),
    [session],
  );
}
