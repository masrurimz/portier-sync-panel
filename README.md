# Portier Integration Sync Console

A web-based integration sync console for a B2B SaaS platform that connects to multiple external services (Salesforce, HubSpot, Stripe, Slack, Zendesk, Intercom) with bidirectional data synchronization and conflict resolution.

## Features

- **Integrations Overview** - Dashboard showing all connected integrations with status indicators (Synced, Syncing, Conflict, Error) and system-level metrics
- **Integration Detail** - Per-integration view with sync statistics, health metadata, and "Sync Now" action with live status updates
- **Review Changes** - Preview incoming changes before applying with field-level comparison, per-change selection, and conflict resolution editing
- **Sync History** - Version tracking with expandable history entries showing applied changes, sources, and audit metadata

## Tech Stack

- **TanStack Start** - SSR framework with file-based routing
- **TanStack Query** - Data fetching, caching, and live "Sync Now" mutations
- **TanStack Form** - Type-safe conflict resolution form with standard schema validation
- **TailwindCSS 4** - Utility-first CSS with custom theme
- **shadcn/ui** - Component library (base-lyra style)
- **TypeScript** - Full type safety with path aliases
- **Turborepo** - Monorepo build system
- **Bun** - Package manager and runtime

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (optional, for containerized deployment)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build

```bash
bun run build
```

### Docker Deployment

#### Build Image

```bash
docker build -t portier-sync .
```

#### Run Container

```bash
docker run -p 3001:3001 portier-sync
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Routes & Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Overview | Dashboard showing all integrations with system metrics |
| `/integration/:integrationId` | Detail | Integration summary with metrics and Sync Now action |
| `/integration/:integrationId/review` | Review | Change preview with field-level comparison and conflict resolution |
| `/integration/:integrationId/history` | History | Sync version history with audit details |

Supported integration IDs: `salesforce`, `hubspot`, `stripe`, `slack`, `zendesk`, `intercom`

## Architecture

### Package Structure

```
portier-sync/
├── apps/
│   └── web/            # TanStack Start SSR app (port 3001)
└── packages/
    ├── api/            # @portier-sync/api — ts-rest contract + MSW handlers
    ├── ui/             # @portier-sync/ui — shadcn/Base UI component library
    ├── env/            # @portier-sync/env — environment validation (Zod)
    └── config/         # @portier-sync/config — shared TypeScript base config
```

### Feature Structure

The sync-console follows a feature-first layout inside `apps/web/src/features/sync-console/`:

```
features/sync-console/
├── index.ts                    # Public API: pages + provider + StatusBadge
├── shared/
│   └── ui.tsx                  # PageShell, SurfaceSection, MetricGrid, StatusBadge, etc.
├── domain/                     # Pure business logic (no React, no fetch)
│   ├── integration.ts          # Integration health, metrics, selectors
│   ├── review.ts               # ReviewBatch, ReviewItem, resolution utilities
│   └── history.ts              # History entry builders
├── state/                      # React context state management
│   ├── sync-session-provider.tsx
│   └── sync-session-selectors.ts
├── api/                        # ts-rest typed client
│   ├── sync-preview.ts         # SyncFetchError + error normalization
│   └── sync-preview.query.ts   # syncClient (initClient from @ts-rest/core)
├── overview/
│   └── page.tsx                # Overview page component
├── detail/
│   └── page.tsx                # Detail page component
├── history/
│   └── page.tsx                # History page component
└── review/
    ├── page.tsx                # Review page component
    ├── ui/                     # ReviewStat, ValuePanel (with inline diff)
    ├── lib/                    # getItemIndicator
    ├── components/             # ReviewResolutionForm
    └── forms/                  # TanStack Form v1 composable:
        ├── resolution-form.ts  #   createFormHookContexts + createFormHook
        ├── fields/             #   ResolutionChoiceField, MergedValueField, NotesField
        ├── submit-button.tsx   #   form.Subscribe reactive button
        └── form-progress.tsx   #   form.Subscribe error display
```

Routes import from `@/features/sync-console` (the public entrypoint), not from deep internal paths.

### State Management

- **TanStack Query**: Query client for server state. Sync Now calls `syncClient.preview.query()` imperatively.
- **Sync Session Provider**: React context holding integrations, reviewBatches, historyByIntegration, syncErrors.
- **TanStack Form v1**: Composable form patterns via `createFormHook` for conflict resolution.

### API Contract

The sync preview endpoint is typed via ts-rest:

```
GET https://portier-takehometest.onrender.com/api/v1/data/sync?application_id={id}

200: ApiSuccessResponse<SyncData>  — { code, message, data: { sync_approval: { application_name, changes[] } } }
400: ApiErrorResponse              — { error, code, message }
500: ApiErrorResponse
502: ApiErrorResponse
```

The contract is defined in `packages/api/src/contract/sync.ts` using `@ts-rest/core` + Zod schemas.

### Development Mocking (MSW)

In development, all requests to the sync endpoint are intercepted by MSW:

```bash
# MSW is activated automatically in dev mode
bun run dev
```

- Handlers live in `packages/api/src/msw/handlers/sync-handlers.ts`
- Mock data (SyncChange[] per integration) lives in `packages/api/src/msw/data/sync-changes.ts`
- Error handlers for 400/502 scenarios in `packages/api/src/msw/handlers/error-handlers.ts`
- MSWProvider initializes the worker; tree-shaken out of production builds

### Design Decisions

**ts-rest over raw fetch**: Contract-first design gives end-to-end type safety. Request params, response bodies,
and error shapes are all typed from the single contract in `packages/api`. Callers cannot accidentally pass
the wrong params or misread the response shape.

**MSW for mocking**: Mock data lives at the HTTP layer, not in the domain layer. Components have no knowledge
of whether data is mocked or real. Error scenarios (502, 400) are easy to test by swapping handlers.

**Feature slices**: Each feature (`overview`, `detail`, `history`, `review`) is self-contained with its own
page, UI components, and hooks. The feature public API (`features/sync-console/index.ts`) enforces the
boundary — routes import from the index, not from deep internal paths.

**TanStack Form v1 composable**: `createFormHook` creates app-level form primitives with typed field and form
components. Field components read from context (`useFieldContext`) instead of prop drilling. `form.Subscribe`
provides granular reactivity without re-rendering the whole form.

## License

MIT
