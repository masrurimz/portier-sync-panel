# @portier-sync/api

The single source of truth for all API contracts, schemas, mock data, and the
type-safe React Query client used by the Portier sync console.

## Structure

```
src/
  schema/         Zod schemas — domain types as the canonical source of truth
  contract/       ts-rest contracts — describe the REST API surface
  msw/
    data/         Static seed data (integrations, history, sync changes)
    handlers/     MSW request handlers, one file per contract
  client.ts       createApiClient() — initialises the ts-rest React Query client
  index.ts        Public barrel
```

## Design decisions

### Zod schemas as source of truth

All domain types live as Zod schemas in `src/schema/`. TypeScript types are
derived via `z.infer<>`. This gives runtime validation and compile-time types
from a single definition with no duplication.

The schema folder is split by domain concern (`integration.ts`, `history.ts`,
`entities.ts`, …) so each file has one responsibility.

### ts-rest for the contract layer

We evaluated several options for a type-safe REST client:

| Library | Verdict |
|---|---|
| **openapi-fetch** | Excellent but requires an OpenAPI YAML spec as input. Our source of truth is Zod schemas, not YAML. Going Zod → OpenAPI YAML → TS types is a circular build pipeline that doubles the maintenance surface. |
| **oRPC** | First-class TanStack Query integration, but its client speaks the oRPC RPC protocol. It cannot call a plain REST API — it needs an oRPC server on the other end. Not applicable here. |
| **zodios** | Last release was ~3 years ago. Abandoned. |
| **better-fetch** | Typed fetch wrapper but no React Query integration. You write manual `queryOptions` wrappers — more boilerplate than ts-rest, not less. |
| **ts-rest** | Contract-first, Zod-native, ships `@ts-rest/react-query` with `initTsrReactQuery` that produces fully-typed `useSuspenseQuery` hooks directly from contracts. Designed for exactly this pattern: client consuming an external REST API with Zod schemas as the type source. |

We pin `3.53.0-rc.1` specifically because it adds Standard Schema support,
which is required for compatibility with Zod v4 (the version in use across this
monorepo). Running 3.52.x against Zod v4 produces subtle type inference failures.

### MSW owns all seed/mock data

Mock data lives in `src/msw/data/` and is served by MSW handlers in development.
There are no `createInitial*` functions in the React runtime — components fetch
data through the query layer just as they would in production. This means the
dev and prod data paths are identical; only the transport differs.

### One client factory, `baseUrl` injected by the consumer

`createApiClient(baseUrl)` in `src/client.ts` binds `apiContract` to a ts-rest
React Query client. The `baseUrl` is the only environment-specific value and is
supplied by the web app at startup. `packages/api` itself has no opinion about
where the API lives.

## Usage

```ts
// apps/web/src/lib/api.ts
import { createApiClient } from '@portier-sync/api/client'

export const tsr = createApiClient('https://portier-takehometest.onrender.com')
```

```tsx
// any component
import { tsr } from '@/lib/api'

const { data } = tsr.integrations.list.useSuspenseQuery({})
```
