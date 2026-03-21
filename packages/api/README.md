# @portier-sync/api

Single source of truth for sync-console API schemas, endpoint contract, typed better-fetch client, TanStack Query `queryOptions` factories, and MSW mock infrastructure.

## Package structure

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

## Endpoint categories

### Real remote endpoint

Default reviewer mode calls this directly; intercepted only when `VITE_MOCK_API=true`:

| Endpoint | Method | Handler | Notes |
|---|---|---|---|
| `https://portier-takehometest.onrender.com/api/v1/data/sync` | GET | Real Portier API | Intercepted only when `VITE_MOCK_API=true` |

### Mock remote-style endpoints

Always intercepted by `localWorker` and `worker`. These are scaffolding for UI development; not real backend routes:

| Endpoint | Method | Handler file | Notes |
|---|---|---|---|
| `/api/v1/integrations` | GET | `integration-handlers.ts` | 6 seeded integrations |
| `/api/v1/integrations/:id` | GET | `integration-handlers.ts` | |
| `/api/v1/integrations/:id/status` | GET | `integration-handlers.ts` | Extended providerHealth |
| `/api/v1/integrations/:id/history` | GET | `history-handlers.ts` | |
| `/api/v1/integrations/:id/draft` | GET/PUT/DELETE | `draft-handlers.ts` | Draft session CRUD |
| `/api/v1/integrations/:id/recover` | POST | `draft-handlers.ts` | Simulate provider recovery |
| `/api/v1/integrations/:id/degrade` | POST | `draft-handlers.ts` | Simulate degradation |
| `/api/v1/provider-status` | GET | `draft-handlers.ts` | All provider health |

### Local-only endpoints

Relative paths; not remote-style. Serve MSW-backed local DB for apply/review flow:

| Endpoint | Method | Handler file | Notes |
|---|---|---|---|
| `/local/integrations/:id/snapshot` | GET | `local-handlers.ts` | CAS-protected snapshot |
| `/local/integrations/:id/apply-review` | PUT | `local-handlers.ts` | CAS apply; returns 409 on stale revision |
| `/local/history` | GET | `local-handlers.ts` | Audit log; filterable by integrationId |

## Design

### 1) Domain schemas stay pure

`schema/*` models domain types only. No transport wiring in those files.

### 2) Contract object is the API map

`api-contract.ts` defines endpoints in a clean object:

- `integrations.list`
- `integrations.get`
- `integrations.status`
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
- `defaultError: ApiErrorResponseSchema`
- `throw: true`

`defaultError` standardizes API error inference around our error schema while preserving better-fetch base error fields (`status`, `statusText`).

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
  integrationStatusQueryOptions,
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

const status = useSuspenseQuery(
  integrationStatusQueryOptions({
    input: { id: '4' },
    staleTime: 30_000,
  })
)

// invalidate detail
queryClient.invalidateQueries({
  queryKey: integrationsKeys.detail('4'),
})
```

## MSW workers

Two workers are exported from `src/msw/browser.ts`:

- **`localWorker`** — scaffolding only; sync preview calls the real API. **This is the default take-home mode.**
- **`worker`** — all handlers including sync preview; use only with `VITE_MOCK_API=true`.

Both are re-exported from `apps/web/src/mocks/browser.ts` and started in `apps/web/src/router.tsx`.