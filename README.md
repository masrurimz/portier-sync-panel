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

## Typecheck and build

```bash
# app typecheck
bunx tsc --noEmit -p apps/web/tsconfig.json

# production build (web scope)
npm run build -- --filter=web
```

## Docker

### Build image

```bash
docker build -t portier-sync .
```

### Run container

```bash
docker run --rm -p 3001:3001 portier-sync
```

Then open `http://localhost:3001`.

The container serves the built web app from `apps/web` via `vite preview` on port `3001`.

## Current architecture notes

- API contracts and query options live in `packages/api`.
- Web feature routes/pages use `IntegrationId` from `@portier-sync/api`.
- Sync session provider keeps local review/apply workflow state and reconciles integration data with query updates.
- History page merges remote history query with local just-applied entries (deduped by id).

## MSW and real API

- Dev uses MSW provider wiring from the web app.
- Sync preview/data contracts are still typed through `@portier-sync/api` regardless of whether backend responses are mocked or real.

## Known limitation

- Docker image build requires network access to pull `oven/bun:1.3.9` from Docker Hub.
  In restricted/offline environments this pull can fail before build steps run.
