import { queryOptions, type UseQueryOptions } from '@tanstack/react-query'
import type { SyncData } from '../schema'
import { $fetch, type ApiError } from '../client'

type QueryExtras<TData> = Omit<
  UseQueryOptions<TData, ApiError, TData, readonly unknown[]>,
  'queryKey' | 'queryFn'
>

export const syncKeys = {
  all: ['sync'] as const,
  preview: (applicationId: string) => [...syncKeys.all, 'preview', applicationId] as const,
}

export interface SyncPreviewInput {
  applicationId: string
}

export function syncPreviewQueryOptions(
  options: QueryExtras<SyncData> & { input: SyncPreviewInput }
) {
  const { input, ...tanstackOptions } = options
  return queryOptions({
    queryKey: syncKeys.preview(input.applicationId),
    queryFn: async (): Promise<SyncData> => {
      const result = await $fetch('@get/api/v1/data/sync', {
        query: { application_id: input.applicationId },
      })
      return result.data
    },
    ...tanstackOptions,
  })
}