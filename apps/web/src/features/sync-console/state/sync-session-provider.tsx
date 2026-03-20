import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApplicationId, Integration, SyncHistoryEntry } from "../../../lib/api-types";
import { createInitialIntegrations, findIntegration, integrationHealthSeed } from "../domain/integration";
import { buildAppliedHistoryEntry, createInitialHistories } from "../domain/history";
import {
  applyStatusFromBatch,
  buildBatchFromApi,
  conflictItems,
  createInitialPreviewMap,
  createInitialReviewBatches,
  selectedItems,
  type ReviewBatch,
  type ReviewItem,
  type ReviewResolution,
} from "../domain/review";
import { normalizeThrownError, type SyncFetchError } from "../api/sync-preview";
import { syncPreviewQueryKey, useSyncPreviewMutation } from "../api/sync-preview.query";

interface SyncSessionContextValue {
  integrations: Integration[];
  historyByIntegration: Record<ApplicationId, SyncHistoryEntry[]>;
  reviewBatches: Record<ApplicationId, ReviewBatch>;
  syncErrors: Partial<Record<ApplicationId, SyncFetchError>>;
  syncingId: ApplicationId | null;
  syncNow: (integrationId: ApplicationId) => Promise<void>;
  updateReviewDecision: (integrationId: ApplicationId, itemId: string, resolution: ReviewResolution) => void;
  toggleReviewSelection: (integrationId: ApplicationId, itemId: string) => void;
  approveSafeChanges: (integrationId: ApplicationId) => void;
  applyReview: (integrationId: ApplicationId) => boolean;
}

const SyncSessionContext = React.createContext<SyncSessionContextValue | null>(null);

export function SyncSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const previewMutation = useSyncPreviewMutation();
  const [integrations, setIntegrations] = React.useState<Integration[]>(() => createInitialIntegrations());
  const [reviewBatches, setReviewBatches] = React.useState<Record<ApplicationId, ReviewBatch>>(() => createInitialReviewBatches());
  const [historyByIntegration, setHistoryByIntegration] = React.useState<Record<ApplicationId, SyncHistoryEntry[]>>(() => createInitialHistories());
  const [syncErrors, setSyncErrors] = React.useState<Partial<Record<ApplicationId, SyncFetchError>>>({});
  const [, setActivePreviewId] = React.useState<Record<ApplicationId, string | null>>(() => createInitialPreviewMap());
  const [syncingId, setSyncingId] = React.useState<ApplicationId | null>(null);

  const syncNow = React.useCallback(
    async (integrationId: ApplicationId) => {
      const integration = findIntegration(integrations, integrationId);

      setSyncingId(integrationId);
      setSyncErrors((current) => ({ ...current, [integrationId]: undefined }));
      setIntegrations((current) => current.map((item) => (item.id === integrationId ? { ...item, status: "syncing" } : item)));

      try {
        const payload = await previewMutation.mutateAsync(integrationId);
        const changes = payload.data?.sync_approval?.changes ?? [];
        const applicationName = payload.data?.sync_approval?.application_name ?? integration.name;
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
    [integrations, previewMutation, queryClient],
  );

  const updateReviewDecision = React.useCallback((integrationId: ApplicationId, itemId: string, resolution: ReviewResolution) => {
    setReviewBatches((current) => ({
      ...current,
      [integrationId]: {
        ...current[integrationId],
        items: current[integrationId].items.map((item) => (item.id === itemId ? { ...item, resolution, selected: true } : item)),
      },
    }));
  }, []);

  const toggleReviewSelection = React.useCallback((integrationId: ApplicationId, itemId: string) => {
    setReviewBatches((current) => ({
      ...current,
      [integrationId]: {
        ...current[integrationId],
        items: current[integrationId].items.map((item) => (item.id === itemId ? { ...item, selected: !item.selected } : item)),
      },
    }));
  }, []);

  const approveSafeChanges = React.useCallback((integrationId: ApplicationId) => {
    setReviewBatches((current) => ({
      ...current,
      [integrationId]: {
        ...current[integrationId],
        items: current[integrationId].items.map((item) => (item.conflict ? item : { ...item, selected: true, resolution: { kind: "external" } })),
      },
    }));
    toast.success("Safe changes marked for approval.");
  }, []);

  const applyReview = React.useCallback(
    (integrationId: ApplicationId) => {
      const batch = reviewBatches[integrationId];
      const selected = selectedItems(batch.items);
      const integration = findIntegration(integrations, integrationId);
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
        [integrationId]: [buildAppliedHistoryEntry({ integrationId, version: batch.versionAfter, selectedItems: selected }), ...current[integrationId]],
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
