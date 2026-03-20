import { initClient } from "@ts-rest/core";

import { syncContract } from "@portier-sync/api";
import type { ApiErrorResponse, SyncData } from "@portier-sync/api";

import type { ApplicationId } from "../../../lib/api-types";

const BASE_URL = "https://portier-takehometest.onrender.com";

// Success response type for the sync preview endpoint (status 200)
export type SyncPreviewSuccessResponse = {
  code: "SUCCESS";
  message: string;
  data: SyncData;
};

// Union response type for all possible statuses
export type SyncPreviewResponse = {
  status: 200;
  body: SyncPreviewSuccessResponse;
} | {
  status: 400 | 500 | 502;
  body: ApiErrorResponse;
};

// Client type for the sync preview endpoint
interface SyncClient {
  preview: (args: { query: { application_id: string } }) => Promise<SyncPreviewResponse>;
}

// Typed ts-rest client bound to the sync contract.
// Note: Cast through unknown to work around ts-rest cross-package type inference.
export const syncClient = initClient(syncContract, {
  baseUrl: BASE_URL,
  baseHeaders: {},
}) as unknown as SyncClient;

// Legacy query key kept for TanStack Query cache interop (setQueryData in provider).
export const syncPreviewQueryKey = (integrationId: ApplicationId) => ["sync-preview", integrationId] as const;