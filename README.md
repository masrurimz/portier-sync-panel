# Portier Integration Sync Console

Take-home implementation of an operations-oriented sync console for multi-integration data synchronization.

---

## Table of contents

- [Quick start](#quick-start)
- [What this demonstrates](#what-this-demonstrates)
- [What is implemented](#what-is-implemented)
- [Real vs modeled behavior](#real-vs-modeled-behavior)
- [Reviewer walkthrough](#reviewer-walkthrough)
- [Architecture in brief](#architecture-in-brief)
- [Stack](#stack)
- [Monorepo layout](#monorepo-layout)
- [Local development](#local-development)
- [Docker](#docker)
- [Available checks](#available-checks)
- [Documentation](#documentation)

---

## Quick start

```bash
bun install
bun run dev
```

App runs at http://localhost:3001.

Docker:

```bash
docker build -t portier-sync .
docker run --rm -p 3001:3001 portier-sync
```

Set `VITE_MOCK_API=true` for fully offline mode — MSW intercepts all endpoints including the live sync preview.

---

## What this demonstrates

Three architectural decisions made before writing any UI:

**1. Contract-first API layer.** `packages/api/src/api-contract.ts` defines every endpoint with Zod schemas for params, output, and error payloads. Types flow contract → fetch schema → query factory → component. Error responses are schema-validated too — the UI only ever sees a typed `SyncFetchError`, never a raw HTTP status code. See [`packages/api/README.md`](packages/api/README.md).

**2. Feature-first folder structure.** All sync workflow logic lives in `apps/web/src/features/sync-console/`. The `-domain/` layer is pure TypeScript with no React and no network calls — it owns the domain model and business rules. The `-state/` layer orchestrates between API and domain. Pages only compose. See [`docs/architecture.md`](docs/architecture.md).

**3. Git-flow conflict resolution model.** The review workflow is modeled on `git add -p`: `syncNow()` builds a staged-changes list, `updateReviewDecision()` marks exactly one item at a time (keep / accept / custom), and `applyReview()` commits only when all items are resolved. A CAS token (`baseRevision`) prevents applying a stale draft. See [`docs/submission-notes.md`](docs/submission-notes.md).

---

## What is implemented

- **Overview** — integration list with synced / syncing / conflict / error status, last sync time, and a priority review queue
- **Detail** — per-integration health metrics, reliability banner, and Sync Now trigger
- **Review queue** — field-level staged-changes list, side-by-side comparison, three-way resolution (keep local / accept incoming / custom value), apply with confirmation
- **History** — audit timeline merging remote-style events with local apply entries; `origin` field preserves provenance

---

## Real vs modeled behavior

| Capability | Data source | Persistence | Notes |
|---|---|---|---|
| Integrations list | MSW-modeled | In-memory (resets on reload) | 6 seeded integrations |
| Integration detail & status | MSW-modeled | In-memory | Includes providerHealth simulation |
| Sync preview (Sync Now) | **Real Portier API** | None — preview only | `GET /api/v1/data/sync?application_id={slug}` |
| Review draft & decisions | Local browser state | In-memory (resets on reload) | Zustand store |
| Apply (confirm changes) | Local MSW endpoint | In-memory | Bumps revision; no remote write |
| Sync history | MSW-modeled + local apply events | In-memory | Merges both with provenance |

---

## Reviewer walkthrough

Three flows worth exercising, each pre-seeded so nothing needs to be triggered first:

**Conflict resolution flow (HubSpot)**
1. Open the overview — HubSpot shows status `conflict`
2. Click HubSpot → Detail page → click **Fetch latest** — triggers the real API call
3. Navigate to Review — 5 pre-seeded pending items are staged
4. Use the three buttons (Keep current / Accept incoming / Custom value) to decide each field
5. Once all items are resolved, Apply becomes active — confirm to write locally
6. History page shows the new local apply entry with `origin: local`

**502 provider error (Stripe)**
1. Open Stripe integration → click Fetch latest
2. Stripe is seeded as `provider_degraded` — the sync call returns a 502
3. The error banner shows "Provider unavailable" with a retry action (502 is marked `retryable: true`)

**Clean sync (Salesforce)**
1. Open Salesforce → Fetch latest — calls the real API; Salesforce returns valid sync data
2. If there are no differing field values, the review queue is empty and status updates to `synced`

---

## Architecture in brief

```
Browser
  └── TanStack Start (SSR framework — routes currently client-rendered)
        └── TanStack Router (file-based routing)
              ├── TanStack Query  →  server state (integrations, history)
              ├── Zustand + Immer →  review session state (draft, decisions)
              └── @portier-sync/api
                    ├── Real: GET /api/v1/data/sync  (portier-takehometest.onrender.com)
                    └── MSW:  all other endpoints    (locally modeled)
```

Feature layers inside `apps/web/src/features/sync-console/`:

| Layer | Location | Rule |
|---|---|---|
| Domain (types + pure functions) | `-domain/` | No React, no network, no side effects |
| State (Zustand store) | `-state/` | Orchestrates API + domain; no rendering |
| UI primitives | `-components/` | No business logic |
| Pages | `overview/` `detail/` `review/` `history/` | Compose from the three layers above |

Full details: [`docs/architecture.md`](docs/architecture.md) · [`docs/runtime-modes.md`](docs/runtime-modes.md)

---

## Stack

| Package | Version / role |
|---|---|
| TanStack Start + Router | v1.141 — SSR framework, file-based routing |
| TanStack Query | v5 — server state, query factories |
| TanStack Form | v1 — review resolution form |
| better-fetch | typed API client with schema validation |
| MSW | v2 — browser service worker mocking |
| shadcn/ui + Tailwind | v4 — Graphite Ops theme |
| Turborepo | monorepo task orchestration |
| Bun | 1.3.9 — runtime and package manager |

---

## Monorepo layout

```text
apps/
  web/                # TanStack Start UI app (port 3001)
packages/
  api/                # API contract, schemas, query factories, MSW handlers
  ui/                 # shadcn/ui component library (Graphite Ops theme)
  env/                # Shared env schema via @t3-oss/env-core
  config/             # Shared TypeScript config
  infra/              # Alchemy/Cloudflare deployment (not used for Docker/local)
```

---

## Local development

```bash
bun install
bun run dev          # http://localhost:3001
```

`VITE_MOCK_API=true bun run dev` — fully offline; MSW intercepts all endpoints including sync preview.

---

## Docker

```bash
docker build -t portier-sync .
docker run --rm -p 3001:3001 portier-sync
```

Multi-stage build: builder installs and compiles; runner copies the full built workspace and serves via `bun run serve` (Vite preview) on port 3001.

---

## Available checks

```bash
bun run check:types   # TypeScript typecheck
bun run check:lint    # Oxlint
bun run check         # Lint + format fix
```

---

## Documentation

| Document | What you will find |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Package boundaries, route map, data flow lifecycle, provenance model, SSR posture, design decisions |
| [`docs/runtime-modes.md`](docs/runtime-modes.md) | Exact real vs MSW-intercepted boundary, handler categories, local endpoints, CAS apply, persistence |
| [`docs/submission-notes.md`](docs/submission-notes.md) | Brief compliance checklist, architectural decisions mapped to each evaluation criterion, known limitations |
| [`packages/api/README.md`](packages/api/README.md) | Three-category endpoint table (real / mock remote-style / local-only), contract design, query factory pattern |
