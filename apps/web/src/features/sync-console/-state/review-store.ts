import {
  $fetch,
  getLocalSnapshot,
  applyLocalReview,
  integrationsKeys,
  type Integration,
  type IntegrationId,
  type SyncChange,
} from "@portier-sync/api";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";

import {
  buildBatchFromApi,
  conflictItems,
  selectedItems,
  type DraftSession,
  type ReviewResolution,
} from "../-domain/review";
import { normalizeThrownError, type SyncFetchError } from "../-domain/errors";

interface ReviewStoreState {
  draftSessions: Record<IntegrationId, DraftSession>;
  syncErrors: Partial<Record<IntegrationId, SyncFetchError>>;
}

interface ReviewStoreActions {
  syncNow: (integrationId: IntegrationId, queryClient: QueryClient) => Promise<DraftSession>;
  updateReviewDecision: (integrationId: IntegrationId, itemId: string, resolution: ReviewResolution) => void;
  toggleReviewSelection: (integrationId: IntegrationId, itemId: string) => void;
  approveSafeChanges: (integrationId: IntegrationId) => void;
  applyReview: (integrationId: IntegrationId, queryClient: QueryClient) => Promise<boolean>;
  clearError: (integrationId: IntegrationId) => void;
}

type ReviewStore = ReviewStoreState & ReviewStoreActions;

// Shape of the remote preview response body from $fetch.
interface SyncPreviewBody {
  code: string;
  message: string;
  data: {
    sync_approval: {
      application_name: string;
      changes: SyncChange[];
    };
    metadata: unknown;
  };
}

function readIntegrationFromCache(
  queryClient: QueryClient,
  integrationId: IntegrationId,
): Integration | null {
  const list = queryClient.getQueryData<Integration[]>(integrationsKeys.list());
  const fromList = list?.find((item) => item.id === integrationId);
  if (fromList) return fromList;
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
  queryClient.setQueryData<Integration>(
    integrationsKeys.detail(integrationId),
    (current) => (current ? updater(current) : current),
  );
}

// Recompute derived counts whenever items mutate.
function computeDraftCounts(items: DraftSession["items"]) {
  return {
    selectedCount: selectedItems(items).length,
    conflictCount: conflictItems(items).length,
    unresolvedCount: items.filter((i) => i.conflict && !i.resolution.kind).length,
  };
}

export const useReviewStore = create<ReviewStore>()(
  immer((set, get) => ({
    draftSessions: {},
    syncErrors: {},

    syncNow: async (integrationId, queryClient) => {
      // Guard: block duplicate in-flight fetch for the same integration.
      if (get().draftSessions[integrationId]?.status === "fetching") {
        const err: SyncFetchError = {
          code: "concurrent_request",
          title: "Sync already running",
          message: "A sync preview is already in progress for this integration.",
          retryable: false,
        };
        set((state) => {
          state.syncErrors[integrationId] = err;
        });
        toast.error(err.title, { description: err.message });
        throw err;
      }

      const integration = readIntegrationFromCache(queryClient, integrationId);
      if (!integration) {
        toast.error("Integration not found", { description: "Could not find integration to sync." });
        throw new Error(`Integration ${integrationId} not found`);
      }

      // Transition to fetching before any async work.
      set((state) => {
        const current = state.draftSessions[integrationId];
        state.draftSessions[integrationId] = {
          integrationId,
          baseVersion: current?.baseVersion ?? integration.version,
          proposedVersion: current?.proposedVersion ?? "",
          status: "fetching",
          items: current?.items ?? [],
          selectedCount: current?.selectedCount ?? 0,
          conflictCount: current?.conflictCount ?? 0,
          unresolvedCount: current?.unresolvedCount ?? 0,
          applicationName: current?.applicationName ?? integration.name,
          fetchedAt: current?.fetchedAt ?? "",
          lastError: undefined,
        } satisfies DraftSession;
        state.syncErrors[integrationId] = undefined;
      });

      updateIntegrationCache(queryClient, integrationId, (c) => ({ ...c, status: "syncing" }));

      try {
        // Read current local snapshot to use as baseVersion.
        // baseVersion = local DB version at fetch time, not the remote version.
        const localSnapshot = await getLocalSnapshot(integrationId);

        // Fetch remote preview. $fetch throws on HTTP errors.
        const response = (await $fetch("@get/api/v1/data/sync", {
          query: { application_id: integration.slug },
        })) as SyncPreviewBody;

        const { changes, application_name: applicationName } = response.data.sync_approval;

        // buildBatchFromApi produces correctly-typed ReviewItem[] with conflict detection.
        const batch = buildBatchFromApi(integrationId, integration, changes, applicationName);
        const counts = computeDraftCounts(batch.items);

        const draft: DraftSession = {
          integrationId,
          baseVersion: localSnapshot.localVersion,
          proposedVersion: batch.versionAfter,
          status: "ready",
          items: batch.items,
          applicationName,
          fetchedAt: batch.fetchedAt,
          ...counts,
        };

        set((state) => {
          state.draftSessions[integrationId] = draft;
        });

        // Update integration cache status based on conflicts found.
        updateIntegrationCache(queryClient, integrationId, (c) => ({
          ...c,
          status: counts.conflictCount > 0 ? "conflict" : "synced",
          lastSynced: new Date(),
        }));

        if (batch.items.length === 0) {
          toast.info(`${integration.name} returned no changes to review.`);
        } else if (counts.conflictCount > 0) {
          toast.warning(
            `${integration.name} preview fetched with ${counts.conflictCount} conflict${counts.conflictCount > 1 ? "s" : ""}.`,
          );
        } else {
          toast.success(`${integration.name} preview fetched successfully.`);
        }

        return draft;
      } catch (error) {
        const normalized = normalizeThrownError(error);
        set((state) => {
          const d = state.draftSessions[integrationId];
          if (d) {
            d.status = "failed";
            d.lastError = normalized;
          }
          state.syncErrors[integrationId] = normalized;
        });
        updateIntegrationCache(queryClient, integrationId, (c) => ({ ...c, status: "error" }));
        toast.error(normalized.title, { description: normalized.message });
        throw normalized;
      }
    },

    updateReviewDecision: (integrationId, itemId, resolution) => {
      set((state) => {
        const draft = state.draftSessions[integrationId];
        if (!draft) return;
        const item = draft.items.find((e) => e.id === itemId);
        if (!item) return;
        item.resolution = { ...resolution };
        item.selected = true;
        const counts = computeDraftCounts(draft.items);
        draft.selectedCount = counts.selectedCount;
        draft.conflictCount = counts.conflictCount;
        draft.unresolvedCount = counts.unresolvedCount;
      });
    },

    toggleReviewSelection: (integrationId, itemId) => {
      set((state) => {
        const draft = state.draftSessions[integrationId];
        if (!draft) return;
        const item = draft.items.find((e) => e.id === itemId);
        if (!item) return;
        item.selected = !item.selected;
        draft.selectedCount = computeDraftCounts(draft.items).selectedCount;
      });
    },

    approveSafeChanges: (integrationId) => {
      set((state) => {
        const draft = state.draftSessions[integrationId];
        if (!draft) return;
        for (const item of draft.items) {
          if (item.conflict) continue;
          item.selected = true;
          item.resolution = { kind: "external" };
        }
        const counts = computeDraftCounts(draft.items);
        draft.selectedCount = counts.selectedCount;
      });
      toast.success("Safe changes marked for approval.");
    },

    applyReview: async (integrationId, queryClient) => {
      const draft = get().draftSessions[integrationId];
      const integration = readIntegrationFromCache(queryClient, integrationId);

      if (!integration) {
        toast.error("Integration not found", { description: "Could not find integration to apply review." });
        return false;
      }

      if (!draft || draft.status === "idle") {
        toast.error("No review draft", { description: "No preview draft available to apply." });
        return false;
      }

      // Stale check: draft is only valid while baseVersion matches the current local snapshot.
      let localSnapshot;
      try {
        localSnapshot = await getLocalSnapshot(integrationId);
      } catch {
        toast.error("Cannot verify local state", {
          description: "Failed to read local snapshot before applying.",
        });
        return false;
      }

      if (draft.baseVersion !== localSnapshot.localVersion) {
        const err: SyncFetchError = {
          code: "stale_batch",
          title: "Review is out of date",
          message:
            "This review was created against an older local version. Fetch the latest preview before applying.",
          retryable: false,
        };
        set((state) => {
          const d = state.draftSessions[integrationId];
          if (d) {
            d.status = "stale";
            d.lastError = err;
          }
          state.syncErrors[integrationId] = err;
        });
        toast.error(err.title, { description: err.message });
        return false;
      }

      const selected = selectedItems(draft.items);
      const unresolved = selected.filter((item) => item.conflict && !item.resolution.kind);

      if (selected.length === 0) {
        toast.error("Select at least one change before applying.");
        return false;
      }
      if (unresolved.length > 0) {
        toast.error("Resolve every selected conflict before applying.");
        return false;
      }

      set((state) => {
        const d = state.draftSessions[integrationId];
        if (d) d.status = "applying";
      });

      try {
        const conflictResolutionCount = selected.filter((i) => i.conflict).length;
        const { snapshot } = await applyLocalReview({
          integrationId,
          proposedVersion: draft.proposedVersion,
          selectedCount: selected.length,
          conflictResolutionCount,
          applicationName: draft.applicationName,
        });

        // Update integration query cache with new local version.
        // Do NOT inject into remote history cache — local audit entry is in the MSW local DB,
        // served by getLocalHistory (consumed by the history page in bead .14).
        updateIntegrationCache(queryClient, integrationId, (c) => ({
          ...c,
          version: snapshot.localVersion,
          status: "synced",
          lastSynced: new Date(),
        }));

        set((state) => {
          const d = state.draftSessions[integrationId];
          if (d) {
            d.status = "applied";
            d.lastError = undefined;
          }
          state.syncErrors[integrationId] = undefined;
        });

        toast.success(`${integration.name} changes applied locally.`);
        return true;
      } catch (error) {
        const normalized = normalizeThrownError(error);
        set((state) => {
          const d = state.draftSessions[integrationId];
          if (d) {
            d.status = "failed";
            d.lastError = normalized;
          }
          state.syncErrors[integrationId] = normalized;
        });
        toast.error(normalized.title, { description: normalized.message });
        return false;
      }
    },

    clearError: (integrationId) => {
      set((state) => {
        state.syncErrors[integrationId] = undefined;
        const d = state.draftSessions[integrationId];
        if (d?.lastError) d.lastError = undefined;
      });
    },
  })),
);

// Hooks

export const useIsSyncing = (integrationId: IntegrationId) =>
  useReviewStore((state) => state.draftSessions[integrationId]?.status === "fetching");

// Returns the DraftSession for one integration. useReviewBatch name kept for stable call sites;
// callers that previously received ReviewBatch now receive DraftSession.
export const useReviewBatch = (integrationId: IntegrationId) =>
  useReviewStore((state) => state.draftSessions[integrationId]);

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
