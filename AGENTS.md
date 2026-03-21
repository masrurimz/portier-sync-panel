# Repository Guidelines

## Project Overview

Portier Sync Console is a take-home frontend implementation of a multi-integration data sync panel. It demonstrates an operations-oriented sync workflow covering integrations overview, per-integration detail and Sync Now, field-level conflict review, and audit history. The app uses MSW to model backend surfaces not provided by the take-home API.

## Start Here

| Document | Read when |
| --- | --- |
| `README.md` | Getting started, running locally, Docker, what is real vs modeled |
| `docs/architecture.md` | Understanding package layout, routes, data flow, provenance model, SSR posture |
| `docs/runtime-modes.md` | Understanding MSW mode switching, local endpoints, draft persistence |
| `docs/submission-notes.md` | Scope decisions, assumptions, known limitations, follow-up work |
| `packages/api/README.md` | API package internals: contract, query factories, MSW layout |

## Package Structure

- `apps/web/src/routes/` — TanStack Router file-based routes; keep thin (params, render feature page only)
- `apps/web/src/features/sync-console/` — all sync console domain, state, and UI
  - `-domain/` — pure types and functions; no React, no side effects
  - `-state/` — Zustand review store; single store for in-session review workflow
  - `-components/` — shared UI primitives scoped to this feature
  - `overview/`, `detail/`, `review/`, `history/` — page components
- `packages/api/src/` — schemas, contract, client, query factories, MSW handlers
- `packages/ui/src/components/` — shadcn/ui components (Graphite Ops theme)

## Important Files

| File | Purpose |
| --- | --- |
| `packages/api/src/api-contract.ts` | Authoritative endpoint contract; schema source of truth |
| `packages/api/src/msw/browser.ts` | Defines `localWorker` vs `worker`; the MSW mode boundary |
| `apps/web/src/router.tsx` | App bootstrap; MSW worker selection and QueryClient setup |
| `apps/web/src/features/sync-console/-state/review-store.ts` | Sync/review/apply orchestration |
| `packages/api/src/msw/handlers/local-handlers.ts` | Local-only CAS-protected apply and audit endpoints |
| `packages/api/src/msw/data/draft-session-store.ts` | In-memory draft state; seeded with HubSpot pending items |
| `packages/env/src/web.ts` | `VITE_MOCK_API` env flag definition |

## Development Commands

Run from repo root:

```bash
bun install           # Install all workspace deps
bun run dev           # Start web app (port 3001)
bun run build         # Production build
bun run check:types   # TypeScript check
bun run check:lint    # Oxlint
bun run check         # Lint + format fix
```

## Runtime / Tooling Rules

- JS runtime and package manager: Bun (`packageManager: bun@1.3.9`)
- Monorepo orchestrator: Turborepo
- Frontend lint/format: Oxlint + Oxfmt
- Git hooks: lefthook (pre-commit runs oxlint + oxfmt)

## Code Conventions

- Routes are thin; all feature logic lives under `apps/web/src/features/sync-console/`.
- API query factories (`queryOptions`, `queryKey`) live in `packages/api/src/queries/`.
- MSW handlers live in `packages/api/src/msw/handlers/`; data stores in `packages/api/src/msw/data/`.
- New endpoints added to the contract must update `api-contract.ts`, `fetch-schema.ts`, and add a corresponding query factory.
- The `review-store.ts` is the only consumer of `applyLocalReview`; do not call local endpoints from components directly.

## Beads Issue Tracking

This project uses `bd` (beads) for multi-session work tracking. Run `bd onboard` to get started. Active epics: `portier-sync-14k` (main take-home), `portier-sync-o6r` (API query layer). Notable open issues: `portier-sync-7mc` (SSR), `portier-sync-s2c` (dual MSW), `portier-sync-q5b.4` (review payload).

## Landing the Plane (Session Completion)

When ending a work session:

1. File issues for remaining work
2. Run quality gates if code changed: `bun run check:types && bun run check:lint`
3. Update issue status via `bd close` / `bd update`
4. `git pull --rebase && bd sync && git push`
5. Verify `git status` shows up to date with origin