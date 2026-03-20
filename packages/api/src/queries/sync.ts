import { queryOptions } from '@tanstack/react-query'
import { tsr } from '../client'

export const syncKeys = {
  all: ['sync'] as const,
  preview: (applicationId: string) => [...syncKeys.all, 'preview', applicationId] as const,
}

export const syncPreviewQueryOptions = (applicationId: string) =>
  queryOptions({
    queryKey: syncKeys.preview(applicationId),
    queryFn: () => tsr.sync.preview.query({ query: { application_id: applicationId } }).then(r => r.body),
  })