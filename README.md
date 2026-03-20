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

### Feature-First Structure

The application follows a feature-first organization within `apps/web/src/features/sync-console/`:

```
features/sync-console/
├── api/                    # TanStack Query hooks and API clients
│   ├── sync-preview.query.ts
│   └── sync-preview.ts
├── domain/                 # Business logic and domain models
│   ├── integration.ts      # Integration health, metrics, utilities
│   ├── review.ts           # Review batch, resolution types
│   └── history.ts          # History entry builders
├── state/                  # State management
│   ├── sync-session-provider.tsx
│   └── sync-session-selectors.ts
├── overview/               # Overview screen
│   └── screens/overview-screen.tsx
├── detail/                 # Detail screen
│   └── screens/integration-detail-screen.tsx
├── review/                 # Review flow
│   ├── screens/integration-review-screen.tsx
│   ├── components/review-resolution-form.tsx
│   └── forms/use-review-resolution-form.ts
└── history/                # History screen
    └── screens/integration-history-screen.tsx
```

### State Management

- **TanStack Query**: Server state for sync preview mutations (Sync Now action)
- **Sync Session Provider**: React context-based state for review resolution, history, and integration data
- **TanStack Form**: Conflict resolution form state with validation

### Routing

File-based routing via TanStack Router:

```
routes/
├── __root.tsx                      # Root layout with providers
├── index.tsx                       # Overview screen
├── integration.$integrationId.tsx  # Integration layout route
├── integration.$integrationId.index.tsx      # Detail screen
├── integration.$integrationId.review.tsx     # Review screen
└── integration.$integrationId.history.tsx    # History screen
```

### Providers

- **QueryProvider**: TanStack Query client configuration
- **SyncSessionProvider**: Sync console state (review items, history, integrations)

## Assumptions & Design Notes

### Data Model

- All integration data, review batches, and history are currently seeded client-side
- The `Sync Now` action calls the external API but response normalization is implemented; full integration pending backend availability
- Review items support three resolution kinds: `local`, `external`, `merged` (with custom merged value)

### API Integration

The sync preview endpoint is:
```
GET https://portier-takehometest.onrender.com/api/v1/data/sync?application_id={id}
```

**Known API behaviors:**
- `salesforce`, `slack`, `intercom`: Return valid preview data
- `hubspot`: May timeout during preview fetch
- `stripe`, `zendesk`: Return 500 errors (simulated provider issues)

Error handling normalizes API errors into user-friendly messages with retry guidance.

### Current Limitations

1. **No persistence**: Review decisions and sync history reset on page reload
2. **Seeded data**: Integration metrics, review batches, and history use seed data with realistic timestamps
3. **No auth**: No authentication layer; assumes trusted internal operators
4. **Single tenant**: No multi-tenancy or workspace isolation

### Type Safety

- Full TypeScript coverage with strict mode
- Path aliases: `@/*` → `apps/web/src/*`, `@portier-sync/ui/*` → `packages/ui/src/*`
- Domain types defined in `apps/web/src/lib/api-types.ts`
- Review resolution uses discriminated unions for kind-safe handling

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server (port 3001) |
| `bun run build` | Build for production |
| `bun run check-types` | TypeScript type check |
| `bun run check` | Lint and format with oxlint |

## Project Structure

```
portier-sync/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/              # App-level providers
│       │   ├── components/       # Shared app components
│       │   ├── features/         # Feature-first modules
│       │   ├── lib/              # Utilities and API types
│       │   ├── routes/           # TanStack Router pages
│       │   └── index.css         # Global styles
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   ├── ui/                       # Shared shadcn/ui components
│   ├── env/                      # Environment configuration
│   └── config/                   # Shared TypeScript config
├── Dockerfile
├── .dockerignore
├── package.json
└── README.md
```

## License

MIT
