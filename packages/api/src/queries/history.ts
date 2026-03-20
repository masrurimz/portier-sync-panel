import { queryOptions, type UseQueryOptions } from '@tanstack/react-query'
import type { IntegrationId, SyncHistoryEntry } from '../schema'
import { $fetch, type ApiError } from '../client'

type QueryExtras<TData> = Omit<
  UseQueryOptions<TData, ApiError, TData, readonly unknown[]>,
  'queryKey' | 'queryFn'
>

export const historyKeys = {
  all: ['history'] as const,
  list: (id: IntegrationId) => [...historyKeys.all, 'list', id] as const,
}

export interface HistoryListInput {
  id: IntegrationId
}

export function historyListQueryOptions(
  options: QueryExtras<SyncHistoryEntry[]> & { input: HistoryListInput }
) {
  const { input, ...tanstackOptions } = options
  return queryOptions({
    queryKey: historyKeys.list(input.id),
    queryFn: async (): Promise<SyncHistoryEntry[]> => {
      const result = await $fetch('@get/api/v1/integrations/:id/history', { params: { id: input.id } })
      return result.data
    },
    ...tanstackOptions,
  })
}