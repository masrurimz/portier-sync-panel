import {
  integrationsKeys,
  integrationsListQueryOptions as apiIntegrationsListQueryOptions,
  integrationDetailQueryOptions as apiIntegrationDetailQueryOptions,
} from "@portier-sync/api";
import type { Integration } from "@portier-sync/api";

// Re-export query key factories under legacy names for backwards compatibility.
export const integrationsQueryKey = () => integrationsKeys.list();
export const integrationDetailQueryKey = (id: string) => integrationsKeys.detail(id);

// Query options for integrations list.
// Wraps the package query options to maintain stable export signature.
export function integrationsQueryOptions() {
  return apiIntegrationsListQueryOptions();
}

// Query options for integration detail.
// Adapts the new signature `{ input: { id } }` to the legacy `id` parameter.
export function integrationDetailQueryOptions(id: string) {
  return apiIntegrationDetailQueryOptions({ input: { id } });
}

// Re-export types used by callers.
export type { Integration };