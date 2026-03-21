# Architecture

## Overview

```
Browser
  └── TanStack Start (SSR framework — routes currently client-rendered)
        └── TanStack Router (file-based, ssr: false on sync-console routes)
              ├── TanStack Query (server state — sync preview fetch)
              ├── Zustand + Immer (review session state)
              └── TanStack Form (review resolution editing only)
                    └── @portier-sync/api (typed client, query factories, MSW)
                          ├── Real: GET /api/v1/data/sync (portier-takehometest.onrender.com)
                          └── MSW: all other endpoints (locally modeled)
```

## Monorepo Packages

| Package | Role |
|--------|------|
| `apps/web` | TanStack Start app, port 3001 |
| `packages/api` | Zod schemas, API contract, better-fetch client, TanStack Query factories, MSW handlers and data stores |
| `packages/ui` | shadcn/ui components with Graphite Ops theme |
| `packages/env` | Environment schema via `@t3-oss/env-core` |
| `packages/config` | Shared TypeScript config |
| `packages/infra` | Alchemy/Cloudflare deployment (not used for Docker/local run) |

## Route Map

| Route | File | Component | SSR |
|-------|------|-----------|-----|
| `/` | `routes/index.tsx` | OverviewPage | `ssr: false` |
| `/integration/$integrationId` | `routes/integration.$integrationId.tsx` | Layout (breadcrumb, tab nav) | `ssr: false` |
| `/integration/$integrationId/` | `routes/integration.$integrationId.index.tsx` | DetailPage | inherited |
| `/integration/$integrationId/review` | `routes/integration.$integrationId.review.tsx` | ReviewPage | inherited |
| `/integration/$integrationId/history` | `routes/integration.$integrationId.history.tsx` | HistoryPage | inherited |

`ssr: false` is applied because current data loading depends on browser-side MSW. Tracked for follow-up in `portier-sync-7mc`.

## Feature Structure

`apps/web/src/features/sync-console/` layout:

- `-domain/` — pure domain types and functions (`integration.ts`, `review.ts`, `errors.ts`, `history.ts`)
- `-state/` — Zustand review store (`review-store.ts`), sync session selectors
- `-components/` — shared UI primitives (status badges, icon, metric grid, shell)
- `overview/` — OverviewPage
- `detail/` — DetailPage
- `review/` — ReviewPage + TanStack Form resolution form
- `history/` — HistoryPage

## Data Flow

Sync preview → review → apply lifecycle:

1. **Sync Now**: `review-store.syncNow()` reads integration slug from query cache → calls `$fetch('GET /api/v1/data/sync', { query: { application_id: slug } })` → on success builds a `DraftSession` in Zustand

2. **Review**: operator makes per-field resolution decisions (`updateReviewDecision`), stored in Zustand

3. **Apply**: `review-store.applyReview()` reads `baseRevision` from local snapshot via `/local/integrations/:id/snapshot` → CAS check → PUT to `/local/integrations/:id/apply-review` → bumps local revision, writes `AuditEntry` with `origin: 'local'`

4. **History**: `HistoryPage` merges MSW-modeled remote-style events with local audit entries via `getLocalHistory()`; `origin` field preserves provenance

## Provenance Model

| Entry type | origin field | Backed by |
|------------|--------------|-----------|
| Remote-style historical events | `remote` | MSW `history-handlers.ts` / `data/history.ts` |
| Local apply confirmations | `local` | `local-handlers.ts` writes to `localAuditLog` |

Local entries are never back-filled as remote-confirmed events; they remain distinguishable in history.

## packages/api Internals

- `schema/` — Zod domain schemas (Integration, SyncChange, AuditEntry, etc.)
- `api-contract.ts` — typed endpoint contract (path, method, schemas) for integrations, history, sync preview
- `fetch-schema.ts` — thin better-fetch adapter from contract
- `client.ts` — `$fetch` client with `throw: true` for TanStack Query compatibility
- `queries/` — `queryOptions` and `queryKey` factories; `local.ts` for MSW-backed local endpoints
- `msw/` — browser workers, handler sets, in-memory data stores

## SSR Posture

- App uses TanStack Start as the SSR framework.
- All sync-console routes are currently `ssr: false`.
- Reason: browser-side MSW provides integrations/history data; server-rendering would bypass those handlers and produce empty or errored responses.
- Follow-up: `portier-sync-7mc` and `portier-sync-s2c` (on a separate branch) track the path to proper dual server/browser MSW and selective SSR restoration.