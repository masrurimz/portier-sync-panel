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