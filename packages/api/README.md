# @portier-sync/api

Single source of truth for sync-console API domain schemas, endpoint contract, better-fetch client, and TanStack Query `queryOptions` factories.

## Structure

```txt
src/
  schema/            Domain Zod schemas (authoritative)
  api-contract.ts    Clean endpoint contract object (path/method/params/query/output)
  fetch-schema.ts    Thin better-fetch createSchema adapter from apiContract
  client.ts          $fetch client (throw: true) + ApiError type
  queries/           Query keys + queryOptions factories
  msw/               Mock data + handlers
  index.ts           Public exports
```

## Design

### 1) Domain schemas stay pure
`schema/*` models domain types only. No transport wiring in those files.

### 2) Contract object is the API map
`api-contract.ts` defines endpoints in a clean object:
- `integrations.list`
- `integrations.get`
- `history.list`
- `sync.preview`

Each endpoint declares only metadata + existing schema references:
- `path`
- `method`
- `params` / `query` / `input` (when needed)
- `output`

### 3) better-fetch schema is a thin adapter
`fetch-schema.ts` maps contract entries into `createSchema(...)` keys. No duplicated large schema literals.

### 4) Client uses throw-based errors for TanStack Query
`client.ts` config:
- `baseURL: https://portier-takehometest.onrender.com`
- `schema: fetchSchema`
- `throw: true`

With `throw: true`, failed responses throw `ApiError` (`BetterFetchError`) so TanStack Query receives errors natively via thrown promises.

## QueryOptions convention

All query factories accept a **single options object**:
- `input`: API-specific input data (route params/query IDs)
- plus all standard TanStack query options (`staleTime`, `enabled`, `gcTime`, `retry`, etc.)

This avoids manual spread at call sites.

### Example

```ts
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  integrationsListQueryOptions,
  integrationDetailQueryOptions,
  integrationsKeys,
} from '@portier-sync/api'

const list = useSuspenseQuery(
  integrationsListQueryOptions({ staleTime: 30_000 })
)

const detail = useSuspenseQuery(
  integrationDetailQueryOptions({
    input: { id: '4' },
    staleTime: 30_000,
  })
)

// invalidate detail
queryClient.invalidateQueries({
  queryKey: integrationsKeys.detail('4'),
})
```

## MSW vs OG API

### Development
MSW can mock all routes.

### Demo/Prod-like behavior
Disable `syncHandlers` so sync preview calls the OG API endpoint:
`GET /api/v1/data/sync?application_id=...`

Integrations/history remain mock-backed UI scaffolding unless a real backend endpoint is introduced.
