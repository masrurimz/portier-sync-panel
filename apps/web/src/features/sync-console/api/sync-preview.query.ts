import { useMutation } from "@tanstack/react-query";

import type { ApplicationId } from "../../../lib/api-types";
import { fetchSyncPreview } from "./sync-preview";

export const syncPreviewQueryKey = (integrationId: ApplicationId) => ["sync-preview", integrationId] as const;

export function useSyncPreviewMutation() {
  return useMutation({
    mutationFn: (integrationId: ApplicationId) => fetchSyncPreview(integrationId),
    retry: false,
  });
}
