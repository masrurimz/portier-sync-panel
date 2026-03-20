import { queryOptions } from '@tanstack/react-query'
import type { IntegrationId } from '../schema'
import { tsr } from '../client'

export const integrationsKeys = {
  all: ['integrations'] as const,
  list: () => [...integrationsKeys.all, 'list'] as const,
  detail: (id: IntegrationId) => [...integrationsKeys.all, 'detail', id] as const,
}

export const integrationsListQueryOptions = () =>
  queryOptions({
    queryKey: integrationsKeys.list(),
    queryFn: () => tsr.integrations.list.query({}).then(r => r.body),
  })

export const integrationDetailQueryOptions = (id: IntegrationId) =>
  queryOptions({
    queryKey: integrationsKeys.detail(id),
    queryFn: () => tsr.integrations.get.query({ params: { id } }).then(r => r.body),
  })