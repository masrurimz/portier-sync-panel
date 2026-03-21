import { historyKeys, integrationsKeys, type Integration, type IntegrationId, type SyncHistoryEntry } from "@portier-sync/api";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";

import { buildAppliedHistoryEntry } from "../-domain/history";
import {
  applyStatusFromBatch,
  buildBatchFromApi,
  conflictItems,
  selectedItems,
  type ReviewBatch,
  type ReviewResolution,
} from "../-domain/review";
import { normalizeApiError, normalizeThrownError, type SyncFetchError } from "../-api/sync-preview";
import { syncClient, syncPreviewQueryKey } from "../-api/sync-preview.query";

interface ReviewStoreState {
  reviewBatches: Record<IntegrationId, ReviewBatch>;
  syncErrors: Partial<Record<IntegrationId, SyncFetchError>>;
  syncingId: IntegrationId | null;
}

interface ReviewStoreActions {
  syncNow: (integrationId: IntegrationId, queryClient: QueryClient) => Promise<ReviewBatch>;
  updateReviewDecision: (integrationId: IntegrationId, itemId: string, resolution: ReviewResolution) => void;
  toggleReviewSelection: (integrationId: IntegrationId, itemId: string) => void;
  approveSafeChanges: (integrationId: IntegrationId) => void;
  applyReview: (integrationId: IntegrationId, queryClient: QueryClient) => boolean;
  clearError: (integrationId: IntegrationId) => void;
}

type ReviewStore = ReviewStoreState & ReviewStoreActions;

function readIntegrationFromCache(queryClient: QueryClient, integrationId: IntegrationId) {
  const list = queryClient.getQueryData<Integration[]>(integrationsKeys.list());
  const fromList = list?.find((item) => item.id === integrationId);
  if (fromList) {
    return fromList;
  }

  return queryClient.getQueryData<Integration>(integrationsKeys.detail(integrationId)) ?? null;
}

function updateIntegrationCache(
  queryClient: QueryClient,
  integrationId: IntegrationId,
  updater: (integration: Integration) => Integration,
) {
  queryClient.setQueryData<Integration[]>(integrationsKeys.list(), (current) =>
    current?.map((item) => (item.id === integrationId ? updater(item) : item)),
  );

  queryClient.setQueryData<Integration>(integrationsKeys.detail(integrationId), (current) =>
    current ? updater(current) : current,
  );
}

export const useReviewStore = create<ReviewStore>()(
  immer((set, get) => ({
    reviewBatches: {},
    syncErrors: {},
    syncingId: null,

    syncNow: async (integrationId, queryClient) => {
      const integration = readIntegrationFromCache(queryClient, integrationId);

      if (!integration) {
        toast.error("Integration not found", { description: "Could not find integration to sync." });
        throw new Error(`Integration ${integrationId} not found`);
      }

      set((state) => {
        state.syncingId = integrationId;
        state.syncErrors[integrationId] = undefined;
      });

      updateIntegrationCache(queryClient, integrationId, (current) => ({ ...current, status: "syncing" }));

      try {
        const result = await syncClient.preview({
          query: { application_id: integration.slug },
        });

        if (result.status !== 200) {
          throw normalizeApiError(result.status, result.body);
        }

        const syncData = result.body;
        const changes = syncData.data.sync_approval.changes;
        const applicationName = syncData.data.sync_approval.application_name;
        const batch = buildBatchFromApi(integrationId, integration, changes, applicationName);

        set((state) => {
          state.reviewBatches[integrationId] = batch;
        });

        updateIntegrationCache(queryClient, integrationId, (current) =>
          applyStatusFromBatch({ ...current, lastSynced: new Date() }, batch),
        );

        queryClient.setQueryData(syncPreviewQueryKey(integrationId), batch);

        if (batch.items.length === 0) {
          toast.info(`${integration.name} returned no changes to review.`);
        } else if (conflictItems(batch.items).length > 0) {
          const conflicts = conflictItems(batch.items).length;
          toast.warning(`${integration.name} preview fetched with ${conflicts} conflict${conflicts > 1 ? "s" : ""}.`);
        } else {
          toast.success(`${integration.name} preview fetched successfully.`);
        }

        return batch;
      } catch (error) {
        const normalized = normalizeThrownError(error);

        set((state) => {
          state.syncErrors[integrationId] = normalized;
        });

        updateIntegrationCache(queryClient, integrationId, (current) => ({ ...current, status: "error" }));

        toast.error(normalized.title, { description: normalized.message });
        throw error;
      } finally {
        set((state) => {
          state.syncingId = null;
        });
      }
    },

    updateReviewDecision: (integrationId, itemId, resolution) => {
      set((state) => {
        const item = state.reviewBatches[integrationId]?.items.find((entry) => entry.id === itemId);
        if (!item) {
          return;
        }

        item.resolution = { ...resolution };
        item.selected = true;
      });
    },

    toggleReviewSelection: (integrationId, itemId) => {
      set((state) => {
        const item = state.reviewBatches[integrationId]?.items.find((entry) => entry.id === itemId);
        if (!item) {
          return;
        }

        item.selected = !item.selected;
      });
    },

    approveSafeChanges: (integrationId) => {
      set((state) => {
        const batch = state.reviewBatches[integrationId];
        if (!batch) {
          return;
        }

        for (const item of batch.items) {
          if (item.conflict) {
            continue;
          }

          item.selected = true;
          item.resolution = { kind: "external" };
        }
      });

      toast.success("Safe changes marked for approval.");
    },

    applyReview: (integrationId, queryClient) => {
      const batch = get().reviewBatches[integrationId];
      const integration = readIntegrationFromCache(queryClient, integrationId);

      if (!integration) {
        toast.error("Integration not found", { description: "Could not find integration to apply review." });
        return false;
      }

      if (!batch) {
        toast.error("No review batch", { description: "No preview batch available to apply." });
        return false;
      }

      const selected = selectedItems(batch.items);
      const unresolved = selected.filter((item) => item.conflict && !item.resolution.kind);

      if (selected.length === 0) {
        toast.error("Select at least one change before applying this batch.");
        return false;
      }

      if (unresolved.length > 0) {
        toast.error("Resolve every selected conflict before applying this batch.");
        return false;
      }

      const historyEntry = buildAppliedHistoryEntry({
        integrationId,
        version: batch.versionAfter,
        selectedItems: selected,
      });

      queryClient.setQueryData<SyncHistoryEntry[]>(historyKeys.list(integrationId), (current) => [historyEntry, ...(current ?? [])]);

      updateIntegrationCache(queryClient, integrationId, (current) => ({
        ...current,
        version: batch.versionAfter,
        status: "synced",
        lastSynced: new Date(),
      }));

      set((state) => {
        const existing = state.reviewBatches[integrationId];
        if (existing) {
          existing.versionBefore = existing.versionAfter;
          existing.items = existing.items.map((item) => ({
            ...item,
            conflict: false,
            selected: false,
          }));
        }

        state.syncErrors[integrationId] = undefined;
      });

      toast.success(`${integration.name} review applied successfully.`);
      return true;
    },

    clearError: (integrationId) => {
      set((state) => {
        state.syncErrors[integrationId] = undefined;
      });
    },
  })),
);

export const useSyncingId = () => useReviewStore((state) => state.syncingId);

export const useReviewBatch = (integrationId: IntegrationId) =>
  useReviewStore((state) => state.reviewBatches[integrationId]);

export const useSyncError = (integrationId: IntegrationId) =>
  useReviewStore((state) => state.syncErrors[integrationId]);

export const useReviewActions = () =>
  useReviewStore(
    useShallow((state) => ({
      syncNow: state.syncNow,
      updateReviewDecision: state.updateReviewDecision,
      toggleReviewSelection: state.toggleReviewSelection,
      approveSafeChanges: state.approveSafeChanges,
      applyReview: state.applyReview,
      clearError: state.clearError,
    })),
  );
