# Portier Integration Sync Console

Take-home implementation of a sync operations console for multi-integration data sync.

## What is implemented

- **Overview**: integration list, status, and high-level operational metrics
- **Detail**: per-integration health, preview summary, and "Fetch latest" (sync preview)
- **Review queue**: field-level conflict resolution and selective apply
- **History**: audit timeline from API history plus local applied events

## Stack

- **TanStack Start + Router** (`apps/web`)
- **TanStack Query v5** for server data
- **TanStack Form v1** for review resolution flows
- **better-fetch** with schema-driven typed client (`packages/api`)
- **MSW** for local/dev API mocking
- **shadcn/ui + Tailwind v4** (`packages/ui`)

## Monorepo layout

```text
apps/
  web/                # UI app
packages/
  api/                # typed API client, schemas, queryOptions, MSW handlers
  ui/                 # shared design system components
  env/                # env schema
  config/             # shared TS config
```

## API behavior

Primary external endpoint:

```text
GET https://portier-takehometest.onrender.com/api/v1/data/sync?application_id={slug}
```

Important model distinction:

- `integration.id`: route identity used by UI (`/integration/$integrationId`)
- `integration.slug`: external API `application_id` used for sync preview calls

## Local development

```bash
bun install
bun run dev
```

App runs at `http://localhost:3001`.

By default the app keeps mocked scaffolding for integrations/history/local apply state, but
the **Fetch latest** / **Sync Now** flow calls the real Portier preview endpoint.
Set `VITE_MOCK_API=true` if you want a fully mocked browser session for local UI work.

## Typecheck and build

```bash
# app typecheck
bunx tsc --noEmit -p apps/web/tsconfig.json

# production build (web scope)
npm run build -- --filter=web
```

## Docker

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Copies all workspace manifests, installs dependencies, builds the web app
2. **Runner stage**: Copies the built workspace and serves from `apps/web` with `vite preview`
### Build image

```bash
docker build -t portier-sync .
```

### Run container

```bash
docker run --rm -p 3001:3001 portier-sync
```

Then open `http://localhost:3001`.

The container runs `bun run serve` from `apps/web` (Vite preview) on port `3001`.

## Current architecture notes

- API contracts and query options live in `packages/api`.
- Web feature routes/pages use `IntegrationId` from `@portier-sync/api`.
- Sync workflow state lives in a Zustand review store; local apply/history scaffolding is served through MSW `/local/*` endpoints.
- History page merges remote history query data with local just-applied entries while keeping provenance explicit.

## Assumptions

- The take-home backend only exposes `GET /api/v1/data/sync`; integrations inventory, history, and apply/commit behavior are intentionally modeled on the frontend.
- Conflict review and confirmation are derived from the fetched preview payload plus local review state; applying decisions is a local simulation because no remote write endpoint is provided.
- The default reviewer path should exercise the real sync preview endpoint instead of silently mocking it.

## Design decisions

- Keep API transport/schema concerns in `packages/api`, UI/domain workflow in `apps/web/src/features/sync-console`, and shared primitives in `packages/ui`.
- Treat sync review as an audit-first workflow: preview first, explicit per-field decision second, local apply/audit trail third.
- Preserve provenance in history so local applies are never mislabeled as remote-confirmed events.

## MSW and real API

- Default runtime: MSW provides scaffolding for integrations/history/local apply state, while sync preview calls the real Portier endpoint.
- `VITE_MOCK_API=true`: MSW also intercepts the sync preview endpoint for fully mocked local development.
- Sync preview payloads remain typed through `@portier-sync/api` regardless of whether the source is real or mocked.