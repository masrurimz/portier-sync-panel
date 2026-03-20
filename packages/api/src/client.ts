import { initTsrReactQuery } from '@ts-rest/react-query/v5'
import { apiContract } from './contract/index'

/**
 * Creates a type-safe React Query client bound to the full API contract.
 *
 * Call once at app startup, export the result as a singleton, and import it
 * wherever you need data. The baseUrl is the only environment-specific value.
 *
 * @example
 * // apps/web/src/lib/api.ts
 * export const tsr = createApiClient('https://portier-takehometest.onrender.com')
 *
 * // in a component
 * const { data } = tsr.integrations.list.useSuspenseQuery({})
 */
export function createApiClient(baseUrl: string) {
  return initTsrReactQuery(apiContract, { baseUrl })
}

export type ApiClient = ReturnType<typeof createApiClient>
