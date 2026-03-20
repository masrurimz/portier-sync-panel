import { queryOptions, type UseQueryOptions } from '@tanstack/react-query'
import type { Integration, IntegrationId } from '../schema'
import { $fetch, type ApiError } from '../client'

type QueryExtras<TData> = Omit<
  UseQueryOptions<TData, ApiError, TData, readonly unknown[]>,
  'queryKey' | 'queryFn'
>

export const integrationsKeys = {
  all: ['integrations'] as const,
  list: () => [...integrationsKeys.all, 'list'] as const,
  detail: (id: IntegrationId) => [...integrationsKeys.all, 'detail', id] as const,
}

export type IntegrationsListInput = Record<string, never>
export interface IntegrationDetailInput {
  id: IntegrationId
}

export function integrationsListQueryOptions(
  options?: QueryExtras<Integration[]> & { input?: IntegrationsListInput }
) {
  const { input: _input, ...tanstackOptions } = options ?? {}
  return queryOptions({
    queryKey: integrationsKeys.list(),
    queryFn: async (): Promise<Integration[]> => {
      const result = await $fetch('@get/api/v1/integrations')
      return result.data
    },
    ...tanstackOptions,
  })
}

export function integrationDetailQueryOptions(
  options: QueryExtras<Integration> & { input: IntegrationDetailInput }
) {
  const { input, ...tanstackOptions } = options
  return queryOptions({
    queryKey: integrationsKeys.detail(input.id),
    queryFn: async (): Promise<Integration> => {
      const result = await $fetch('@get/api/v1/integrations/:id', { params: { id: input.id } })
      return result.data
    },
    ...tanstackOptions,
  })
}