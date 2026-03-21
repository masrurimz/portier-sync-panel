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
├── MSW-modeled (dev) / Real (prod): GET|PUT /api/v1/integrations/:id/snapshot|apply-review|audit
└── MSW-modeled: all other scaffolding endpoints
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

3. **Apply**: `review-store.applyReview()` reads `baseRevision` from local snapshot via `GET /api/v1/integrations/:id/snapshot` → client-side CAS pre-flight (advisory) → `PUT /api/v1/integrations/:id/apply-review` with `expectedRevision` → server increments revision, writes `AuditEntry` with `origin: 'local'`; returns 409 if revision changed since fetch

4. **History**: `HistoryPage` merges MSW-modeled remote-style events with local audit entries via `getLocalHistory()`; `origin` field preserves provenance

## Provenance Model

| Entry type | origin field | Backed by |
|------------|--------------|-----------|
| Remote-style historical events | `remote` | MSW `history-handlers.ts` / `data/history.ts` |
| Local apply confirmations | `local` | `local-db-handlers.ts` writes to `localAuditLog` |

Local entries are never back-filled as remote-confirmed events; they remain distinguishable in history.

## packages/api Internals

- `schema/` — Zod domain schemas (Integration, SyncChange, AuditEntry, LocalSnapshot, ApplyReviewBody, ApplyReviewResult, etc.)
- `api-contract.ts` — typed endpoint contract (path, method, schemas) for integrations, history, sync preview, and local DB (snapshot, apply-review, audit)
- `fetch-schema.ts` — thin better-fetch adapter from contract
- `client.ts` — `$fetch` client with `throw: true` for TanStack Query compatibility
- `queries/` — `queryOptions` and `queryKey` factories; `local.ts` for local DB endpoints (snapshot, apply-review, audit) — uses typed $fetch routes
- `msw/` — browser workers, handler sets, in-memory data stores

## SSR Posture

- App uses TanStack Start as the SSR framework.
- All sync-console routes are currently `ssr: false`.
- Reason: browser-side MSW provides integrations/history data; server-rendering would bypass those handlers and produce empty or errored responses.
- Follow-up: `portier-sync-7mc` and `portier-sync-s2c` (on a separate branch) track the path to proper dual server/browser MSW and selective SSR restoration.

## Design Decisions

### Why a dedicated `packages/api` package

Keeping schemas, the fetch client, query factories, and MSW handlers in a single package enforces a strict one-way dependency. The web app cannot reach the network without going through a typed endpoint in `api-contract.ts`. If the API changes shape, the Zod schema fails; the web app cannot silently operate on stale data. MSW handlers live in the same package so they are forced to satisfy the same schemas — a handler that returns a field the schema doesn't know about will surface at validation time, not at runtime in a component.

### Why `-domain/` is pure TypeScript with no React

`-domain/` contains the business logic the brief specifically evaluates: conflict detection, resolution modeling, error classification, provenance rules. Keeping it framework-free means:

- The rules can be read and tested without mounting a component tree.
- A future migration (React → something else, Zustand → something else) doesn't touch the domain layer.
- The brief's question — 'how does the system make sync safe, transparent, reviewable, auditable?' — has a single file to answer it: `-domain/review.ts`.

### Why `DraftSession.baseRevision` instead of a timestamp

A revision counter (integer) is used as the CAS token rather than a timestamp because:

- Timestamps are ambiguous under concurrent writes (two writes within the same millisecond would not be detected).
- The revision starts at 1 and increments on every successful apply. There is no ambiguity about ordering.
- The server-side CAS check in `local-db-handlers.ts` (serving `PUT /api/v1/integrations/:id/apply-review`) is the authoritative guard. The client-side pre-flight check in `applyReview()` is advisory — it provides a fast failure path and a better error message (`stale_batch`) before the round-trip.

### Why the three-way resolution model (`local` / `external` / `merged`)

The brief gives an example: `john@company.com` vs `j.smith@newdomain.com`. Neither value is trivially correct. The three-way model acknowledges this:

- `local` — the current system value is authoritative for this field.
- `external` — the incoming value should replace it.
- `merged` — neither value is right; the operator supplies the correct one.

This maps directly to standard three-way merge semantics. Any resolution model with fewer choices forces an implicit policy the operator didn't approve.

### Why MSW instead of a fake backend

A fake Node server would need to be started separately, would not be intercepting the same fetch calls the real API uses, and would introduce a second process into the reviewer's setup. MSW runs in the browser service worker layer: the same `fetch()` call that hits the real API in production is intercepted in the browser in development. The real-vs-mocked boundary is a single boolean (`VITE_MOCK_API`) and it is visible in code, not in a `.env` comment. See `docs/runtime-modes.md` for the full boundary table.

### Why TanStack Query over the alternatives

The sync console has three separate page-level consumers of the same integration data: the overview list, the detail page, and the review page. Without a shared cache, each would either refetch independently (three round-trips for the same data) or require a global store with manual staleness tracking. TanStack Query's cache is keyed by `queryKey` — all three consumers share the same in-flight request and the same cached result. Invalidating `integrationsKeys.detail('2')` propagates to every subscriber automatically.

`useSuspenseQuery` moves loading and error state out of component render logic entirely. Components declare what data they need; the Suspense boundary handles the loading/error boundary. Without this, every component would have an `if (isLoading)` / `if (isError)` branch duplicated across the feature.

Why not **orpc/ts-rest**: These are server-first frameworks — they generate a typed client from a server-side router. In this project the backend is owned by Portier; we only have an HTTP spec. There is no server to couple to. orpc/ts-rest would add framework coupling where we need outside-in contract modeling.

Why not **SWR**: SWR lacks the query factory / key hierarchy model. Invalidating a specific integration's detail without knowing which components subscribe to it requires either a key registry or a cache-clearing strategy that scales poorly. TanStack Query's hierarchical keys (`integrationsKeys.detail(id)`, `integrationsKeys.all`) make targeted invalidation structural, not accidental.

Why not **plain better-fetch + useState**: No shared cache. Each component fetches independently, staleness is managed manually, and there is no standard invalidation path between pages.

### Why better-fetch as the HTTP adapter

Native `fetch` has no response schema validation. A request that returns a 200 with a malformed body is indistinguishable from a valid success response until a component tries to read a field that does not exist. `better-fetch` with `createSchema` validates the response against the Zod schema before returning it to any caller. A schema mismatch surfaces at the API boundary, not inside a component.

Why not **orpc/ts-rest**: Same reason as above — server-first frameworks require a shared server router. `better-fetch`'s `createSchema` wraps an external HTTP spec from the outside, with no server-side dependency. This is the correct model for a project where the backend is external.

Why not **native fetch with manual Zod parsing**: Possible, but `better-fetch` handles the boilerplate (baseURL, default headers, error response normalization) and integrates `defaultError` for typed error inference. Rolling this manually produces the same result with more surface area.

The `throw: true` configuration makes failed responses throw `ApiError` (`BetterFetchError`). TanStack Query's error boundary model depends on thrown promises — a fetch that returns `{ ok: false, data: null }` without throwing would be invisible to TanStack Query's error state.

The better-fetch + TanStack Query split is a deliberate decomposition: better-fetch owns transport and schema validation; TanStack Query owns caching and lifecycle. Each does one job. A monolithic client (e.g., an orpc client) would collapse these responsibilities and make them harder to reason about or replace independently.

### Why seed data lives in the MSW handler layer

The choice to place seed data in `packages/api/src/msw/data/` rather than in Zustand initial state or component defaults is as deliberate as the choice to use MSW at all.

The web app has **zero awareness** of the seed data. `OverviewPage` calls `integrationsListQueryOptions()` and gets integrations back. It does not know whether the response came from `portier-takehometest.onrender.com` or from MSW's in-memory store. This is the definition of a correct API seam: a real API is a true drop-in replacement.

Seeding in Zustand would mix application state with test data in the same namespace. Application state and seed data have different owners (the operator's session vs. a developer's fixture) and different lifetimes. Keeping them in the same store makes it structurally impossible to tell which mutations come from the operator and which came from initialization.

Seeding as component defaults or inline constants would bypass the API contract entirely — no Zod schema validation, no `ApiSuccessResponseSchema` envelope, no real-vs-mock swap. The component would be testing static data, not the system's response to an API call.

HubSpot starting in `conflict` status is a **domain-level fact**, not a UI stub. Because it is seeded at the data layer, the entire system reacts to it truthfully: the priority queue appears on the overview, the badge count is computed from live query data, and the review flow is exercisable through the real `syncNow()` → `updateReviewDecision()` → `applyReview()` path. If this were a UI-level stub, you would be exercising the stub, not the system.