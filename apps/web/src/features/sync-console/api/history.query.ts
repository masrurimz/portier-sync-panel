import { initClient } from "@ts-rest/core";
import { queryOptions } from "@tanstack/react-query";

import { historyContract } from "@portier-sync/api";
import type { ApiErrorResponse, SyncHistoryEntry } from "@portier-sync/api";

const BASE_URL = "https://portier-takehometest.onrender.com";

// Success response type for the history list endpoint (status 200)
export type HistoryListSuccessResponse = {
  code: "SUCCESS";
  message: string;
  data: SyncHistoryEntry[];
};

// Union response type for history list endpoint
export type HistoryListResponse =
  | { status: 200; body: HistoryListSuccessResponse }
  | { status: 404; body: ApiErrorResponse }
  | { status: 500; body: ApiErrorResponse };

// Client type for the history contract
interface HistoryClient {
  list: (args: { params: { path: { id: string } } }) => Promise<HistoryListResponse>;
}

// Typed ts-rest client bound to the history contract.
// Note: Cast through unknown to work around ts-rest cross-package type inference.
export const historyClient = initClient(historyContract, {
  baseUrl: BASE_URL,
  baseHeaders: {},
}) as unknown as HistoryClient;

// Query key factory
export const integrationHistoryQueryKey = (id: string) =>
  ["integrations", id, "history"] as const;

// Query options for integration history
export function integrationHistoryQueryOptions(id: string) {
  return queryOptions({
    queryKey: integrationHistoryQueryKey(id),
    queryFn: async () => {
      const response = await historyClient.list({
        params: { path: { id } },
      });
      if (response.status === 200) {
        return response.body.data;
      }
      throw new Error(response.body.message);
    },
  });
}