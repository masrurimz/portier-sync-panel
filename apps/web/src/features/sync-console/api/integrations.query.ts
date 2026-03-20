import { initClient } from "@ts-rest/core";
import { queryOptions } from "@tanstack/react-query";

import { integrationsContract } from "@portier-sync/api";
import type { ApiErrorResponse, Integration } from "@portier-sync/api";

const BASE_URL = "https://portier-takehometest.onrender.com";

// Success response type for the integrations list endpoint (status 200)
export type IntegrationsListSuccessResponse = {
  code: "SUCCESS";
  message: string;
  data: Integration[];
};

// Success response type for the integration detail endpoint (status 200)
export type IntegrationDetailSuccessResponse = {
  code: "SUCCESS";
  message: string;
  data: Integration;
};

// Union response type for list endpoint
export type IntegrationsListResponse =
  | { status: 200; body: IntegrationsListSuccessResponse }
  | { status: 500; body: ApiErrorResponse };

// Union response type for detail endpoint
export type IntegrationDetailResponse =
  | { status: 200; body: IntegrationDetailSuccessResponse }
  | { status: 404; body: ApiErrorResponse }
  | { status: 500; body: ApiErrorResponse };

// Client type for the integrations contract
interface IntegrationsClient {
  list: () => Promise<IntegrationsListResponse>;
  get: (args: { params: { path: { id: string } } }) => Promise<IntegrationDetailResponse>;
}

// Typed ts-rest client bound to the integrations contract.
// Note: Cast through unknown to work around ts-rest cross-package type inference.
export const integrationsClient = initClient(integrationsContract, {
  baseUrl: BASE_URL,
  baseHeaders: {},
}) as unknown as IntegrationsClient;

// Query key factories
export const integrationsQueryKey = () => ["integrations"] as const;
export const integrationDetailQueryKey = (id: string) => ["integrations", id] as const;

// Query options for integrations list
export function integrationsQueryOptions() {
  return queryOptions({
    queryKey: integrationsQueryKey(),
    queryFn: async () => {
      const response = await integrationsClient.list();
      if (response.status === 200) {
        return response.body.data;
      }
      throw new Error(response.body.message);
    },
  });
}

// Query options for integration detail
export function integrationDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: integrationDetailQueryKey(id),
    queryFn: async () => {
      const response = await integrationsClient.get({
        params: { path: { id } },
      });
      if (response.status === 200) {
        return response.body.data;
      }
      throw new Error(response.body.message);
    },
  });
}