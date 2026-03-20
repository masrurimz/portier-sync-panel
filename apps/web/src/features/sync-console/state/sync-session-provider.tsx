import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { integrationsListQueryOptions, type Integration, type IntegrationId, type SyncHistoryEntry } from "@portier-sync/api";
import { findIntegration, integrationHealthSeed } from "../domain/integration";
import { buildAppliedHistoryEntry } from "../domain/history";
import {
  applyStatusFromBatch,
  buildBatchFromApi,
  conflictItems,
  selectedItems,
  type ReviewBatch,
  type ReviewItem,
  type ReviewResolution,
} from "../domain/review";
import { normalizeApiError, normalizeThrownError, type SyncFetchError } from "../api/sync-preview";
import { syncPreviewQueryKey, syncClient } from "../api/sync-preview.query";

interface SyncSessionContextValue {
  integrations: Integration[];
  historyByIntegration: Record<IntegrationId, SyncHistoryEntry[]>;
  reviewBatches: Record<IntegrationId, ReviewBatch>;
  syncErrors: Partial<Record<IntegrationId, SyncFetchError>>;
  syncingId: IntegrationId | null;
  syncNow: (integrationId: IntegrationId) => Promise<void>;
  updateReviewDecision: (integrationId: IntegrationId, itemId: string, resolution: ReviewResolution) => void;
  toggleReviewSelection: (integrationId: IntegrationId, itemId: string) => void;
  approveSafeChanges: (integrationId: IntegrationId) => void;
  applyReview: (integrationId: IntegrationId) => boolean;
}

const SyncSessionContext = React.createContext<SyncSessionContextValue | null>(null);

export function SyncSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [reviewBatches, setReviewBatches] = React.useState<Record<IntegrationId, ReviewBatch>>({});
  const [historyByIntegration, setHistoryByIntegration] = React.useState<Record<IntegrationId, SyncHistoryEntry[]>>({});
  const [syncErrors, setSyncErrors] = React.useState<Partial<Record<IntegrationId, SyncFetchError>>>({});
  const [, setActivePreviewId] = React.useState<Record<IntegrationId, string | null>>({});
  const [syncingId, setSyncingId] = React.useState<IntegrationId | null>(null);
  const { data: integrationsData = [] } = useQuery(integrationsListQueryOptions());

  React.useEffect(() => {
    if (integrations.length === 0 && integrationsData.length > 0) {
      setIntegrations(integrationsData);
    }
  }, [integrations.length, integrationsData]);

  const syncNow = React.useCallback(
    async (integrationId: IntegrationId) => {
      const integration = findIntegration(integrations, integrationId);

      if (!integration) {
        toast.error("Integration not found", { description: "Could not find integration to sync." });
        throw new Error(`Integration ${integrationId} not found`);
      }

      setSyncingId(integrationId);
      setSyncErrors((current) => ({ ...current, [integrationId]: undefined }));
      setIntegrations((current) => current.map((item) => (item.id === integrationId ? { ...item, status: "syncing" } : item)));

      try {
        const result = await syncClient.preview({
          query: { application_id: integration.slug },
        });
        if (result.status !== 200) {
          throw normalizeApiError(result.status, result.body);
        }
        // At this point, result.body is SyncData (status 200)
        const syncData = result.body;
        const changes = syncData.data.sync_approval.changes;
        const applicationName = syncData.data.sync_approval.application_name;
        const batch = buildBatchFromApi(integrationId, integration, changes, applicationName);

        setReviewBatches((current) => ({ ...current, [integrationId]: batch }));
        setActivePreviewId((current) => ({ ...current, [integrationId]: batch.source }));
        setIntegrations((current) =>
          current.map((item) => (item.id === integrationId ? applyStatusFromBatch({ ...item, lastSynced: new Date() }, batch) : item)),
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
      } catch (error) {
        const normalized = normalizeThrownError(error);
        setSyncErrors((current) => ({ ...current, [integrationId]: normalized }));
        setIntegrations((current) => current.map((item) => (item.id === integrationId ? { ...item, status: "error" } : item)));
        toast.error(normalized.title, { description: normalized.message });
        throw error;
      } finally {
        setSyncingId(null);
      }
    },
    [integrations, queryClient],
  );

  const updateReviewDecision = React.useCallback((integrationId: IntegrationId, itemId: string, resolution: ReviewResolution) => {
    setReviewBatches((current) => {
      const existing = current[integrationId];
      if (!existing) return current;
      return {
        ...current,
        [integrationId]: {
          ...existing,
          items: existing.items.map((item) => (item.id === itemId ? { ...item, resolution, selected: true } : item)),
        },
      };
    });
  }, []);

  const toggleReviewSelection = React.useCallback((integrationId: IntegrationId, itemId: string) => {
    setReviewBatches((current) => {
      const existing = current[integrationId];
      if (!existing) return current;
      return {
        ...current,
        [integrationId]: {
          ...existing,
          items: existing.items.map((item) => (item.id === itemId ? { ...item, selected: !item.selected } : item)),
        },
      };
    });
  }, []);

  const approveSafeChanges = React.useCallback((integrationId: IntegrationId) => {
    setReviewBatches((current) => {
      const existing = current[integrationId];
      if (!existing) return current;
      return {
        ...current,
        [integrationId]: {
          ...existing,
          items: existing.items.map((item) => (item.conflict ? item : { ...item, selected: true, resolution: { kind: "external" } })),
        },
      };
    });
    toast.success("Safe changes marked for approval.");
  }, []);

  const applyReview = React.useCallback(
    (integrationId: IntegrationId) => {
      const batch = reviewBatches[integrationId];
      const integration = findIntegration(integrations, integrationId);

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

      setHistoryByIntegration((current) => ({
        ...current,
        [integrationId]: [buildAppliedHistoryEntry({ integrationId, version: batch.versionAfter, selectedItems: selected }), ...(current[integrationId] ?? [])],
      }));

      setIntegrations((current) =>
        current.map((item) =>
          item.id === integrationId
            ? {
                ...item,
                version: batch.versionAfter,
                status: "synced",
                lastSynced: new Date(),
              }
            : item,
        ),
      );

      setReviewBatches((current) => ({
        ...current,
        [integrationId]: {
          ...batch,
          versionBefore: batch.versionAfter,
          items: batch.items.map((item) => ({ ...item, conflict: false, selected: false })),
        },
      }));

      setSyncErrors((current) => ({ ...current, [integrationId]: undefined }));
      toast.success(`${integration.name} review applied successfully.`);
      return true;
    },
    [integrations, reviewBatches],
  );

  const value = React.useMemo(
    () => ({
      integrations,
      historyByIntegration,
      reviewBatches,
      syncErrors,
      syncingId,
      syncNow,
      updateReviewDecision,
      toggleReviewSelection,
      approveSafeChanges,
      applyReview,
    }),
    [integrations, historyByIntegration, reviewBatches, syncErrors, syncingId, syncNow, updateReviewDecision, toggleReviewSelection, approveSafeChanges, applyReview],
  );

  return <SyncSessionContext.Provider value={value}>{children}</SyncSessionContext.Provider>;
}

export function useSyncSession() {
  const context = React.useContext(SyncSessionContext);
  if (!context) {
    throw new Error("useSyncSession must be used within SyncSessionProvider");
  }
  return context;
}

export { integrationHealthSeed, type ReviewItem, type ReviewResolution };
