# Portier Integration Sync Console

Take-home implementation of an operations-oriented sync console for multi-integration data synchronization.

## Quick start for reviewers

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

Note: `VITE_MOCK_API=true bun run dev` for fully mocked mode (no real API calls).

## What is implemented

- **Overview**: integration list, status, and high-level operational metrics
- **Detail**: per-integration health, preview summary, and "Fetch latest" (sync preview)
- **Review queue**: field-level conflict resolution and selective apply
- **History**: audit timeline from API history plus local applied events

## Real vs modeled behavior

| Capability | Data source | Persistence | Notes |
|---|---|---|---|
| Integrations list | MSW-modeled | In-memory (resets on reload) | 6 seeded integrations |
| Integration detail & status | MSW-modeled | In-memory | Includes providerHealth simulation |
| Sync preview (Sync Now) | **Real Portier API** | None — preview only | `GET /api/v1/data/sync?application_id={slug}` |
| Review draft & decisions | Local browser state | In-memory (resets on reload) | Zustand store |
| Apply (confirm changes) | Local MSW endpoint | In-memory | Bumps revision; no remote write |
| Sync history | MSW-modeled + local apply events | In-memory | Merges remote-style mock history with local audit entries |

## Stack

| Package | Version |
|---|---|
| TanStack Start + Router | v1.141 |
| TanStack Query | v5 |
| TanStack Form | v1 |
| better-fetch | typed API client |
| MSW | v2 |
| shadcn/ui + Tailwind | v4 |
| Turborepo | monorepo |
| Bun | 1.3.9 |

## Monorepo layout

```text
apps/
  web/                # TanStack Start UI app
packages/
  api/                # typed API client, schemas, queryOptions, MSW handlers
  ui/                 # shadcn/ui component library (Graphite Ops theme)
  env/                # shared env schema via @t3-oss/env-core
  config/             # shared TypeScript config
  infra/              # Alchemy/Cloudflare infra (deployment only)
```

## Local development

```bash
bun install
bun run dev
```

App runs at http://localhost:3001.

Set `VITE_MOCK_API=true` for offline development — MSW intercepts all endpoints including sync preview.

## Docker

```bash
docker build -t portier-sync .
docker run --rm -p 3001:3001 portier-sync
```

Multi-stage build: builder installs dependencies and builds the app; runner copies the full built workspace and serves via `bun run serve` (Vite preview) on port 3001.

## Available checks

```bash
bun run check:types   # TypeScript typecheck
bun run check:lint    # Oxlint
bun run check         # Lint + format fix
```

## Documentation

| Document | Contents |
|---|---|
| `docs/architecture.md` | Package boundaries, route map, data flow, state ownership, provenance rules |
| `docs/runtime-modes.md` | Real vs modeled API boundaries, MSW mode switching, SSR posture |
| `docs/submission-notes.md` | Assumptions, scope decisions, known limitations, follow-ups |
| `packages/api/README.md` | API package internals: schemas, contract, query factories, MSW layout |

## Assumptions & design decisions

- The take-home backend only exposes `GET /api/v1/data/sync`. Integrations inventory, history, and apply/commit behavior are modeled on the frontend.
- Conflict review and confirmation derive from the fetched preview payload plus local review state. Applying decisions is a local simulation — no remote write endpoint exists.
- `integration.id` is route identity used by UI (`/integration/$integrationId`); `integration.slug` is the `application_id` parameter for sync preview calls.
- Default reviewer path exercises the real sync preview endpoint rather than silently mocking it.
- Sync review is an audit-first workflow: preview, explicit per-field decision, local apply with audit trail.
- History preserves provenance so local applies are never mislabeled as remote-confirmed events.
- API transport/schema concerns stay in `packages/api`. UI/domain workflow lives in `apps/web/src/features/sync-console`. Shared primitives are in `packages/ui`.