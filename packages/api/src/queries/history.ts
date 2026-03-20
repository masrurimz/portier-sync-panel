import { queryOptions } from '@tanstack/react-query'
import type { IntegrationId } from '../schema'
import { tsr } from '../client'

export const historyKeys = {
  all: ['history'] as const,
  list: (id: IntegrationId) => [...historyKeys.all, 'list', id] as const,
}

export const historyListQueryOptions = (id: IntegrationId) =>
  queryOptions({
    queryKey: historyKeys.list(id),
    queryFn: () => tsr.history.list.query({ params: { id } }).then(r => r.body),
  })