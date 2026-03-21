# Runtime Modes

## Overview

The app has two runtime modes controlled by the `VITE_MOCK_API` environment variable. In the default mode, integrations inventory and workflow state are provided by an MSW browser service worker, while the Sync Now preview call hits the real remote API. In fully mocked mode, even the sync preview is intercepted locally.

## Mode Comparison

| Aspect | Default mode (`VITE_MOCK_API` unset) | Fully mocked (`VITE_MOCK_API=true`) |
|--------|--------------------------------------|-------------------------------------|
| Sync preview (`/api/v1/data/sync`) | **Real Portier API** | MSW-intercepted |
| Integrations list & detail | MSW-modeled | MSW-modeled |
| Sync history | MSW-modeled | MSW-modeled |
| Review draft state | Zustand in-memory | Zustand in-memory |
| Local snapshot & audit | MSW `/api/v1/integrations/:id/snapshot`, `/apply-review`, `/audit` | MSW `/api/v1/...` |
| Network required | Yes (sync preview) | No |
| Use case | Reviewer path, take-home demo | Offline development |

## How Mode Switching Works

The mode is determined at browser bootstrap:

1. `packages/env/src/web.ts` exposes `env.VITE_MOCK_API: boolean`
2. `apps/web/src/router.tsx` checks `env.VITE_MOCK_API` at bootstrap:
   - `true` → starts `worker` (all handlers including sync)
   - `false`/unset → starts `localWorker` (scaffolding only)
3. Both workers are defined in `packages/api/src/msw/browser.ts`

```typescript
// packages/api/src/msw/browser.ts
const scaffoldingHandlers = [
  ...integrationHandlers,
  ...draftHandlers,
  ...providerHandlers,
  ...historyHandlers,
  ...localDbHandlers,
]

const syncPreviewHandlers = [
  ...syncHandlers,
]

// Full mock: intercepts everything including sync preview
export const worker = setupWorker(...scaffoldingHandlers, ...syncPreviewHandlers)

// Default: scaffolding only; sync preview hits real API
export const localWorker = setupWorker(...scaffoldingHandlers)
```

```typescript
// apps/web/src/router.tsx
const mswReady =
  typeof window !== "undefined"
    ? import("./mocks/browser").then(({ worker, localWorker }) => {
      if (env.VITE_MOCK_API) {
        return worker.start({ onUnhandledRequest: "bypass" });
      }
      return localWorker.start({ onUnhandledRequest: "bypass" });
    })
    : Promise.resolve();
```

## MSW Handler Categories

| Category | Base URL | Handlers | Active in localWorker | Active in worker |
|----------|----------|----------|----------------------|------------------|
| Scaffolding — integrations | `https://portier-takehometest.onrender.com` | `integration-handlers.ts` | Yes | Yes |
| Scaffolding — history | `https://portier-takehometest.onrender.com` | `history-handlers.ts` | Yes | Yes |
| Scaffolding — draft | `https://portier-takehometest.onrender.com` | `draft-handlers.ts` | Yes | Yes |
| Scaffolding — provider sim | `https://portier-takehometest.onrender.com` | `draft-handlers.ts` (recover/degrade) | Yes | Yes |
| Local endpoints | `https://portier-takehometest.onrender.com` | `local-handlers.ts` (as `localDbHandlers`) | Yes | Yes |
| Sync preview | `https://portier-takehometest.onrender.com/api/v1/data/sync` | `sync-handlers.ts` | **No** | Yes |

The `error-handlers.ts` file exists separately for testing specific error scenarios but is not part of either default worker. It can be used to override handlers in custom test setups.

## Local DB Endpoints

These endpoints back the managed local database. They are part of the real API contract (`apiContract.local`) and follow the same `ApiSuccessResponseSchema` envelope as all other endpoints. In development, MSW intercepts them at the `BASE_URL` origin; in production, they are served by the real backend.

- `GET /api/v1/integrations/:id/snapshot` — read local snapshot (revision CAS token + recordCount)
- `PUT /api/v1/integrations/:id/apply-review` — apply reviewed changes with CAS protection; `expectedRevision` must equal current `snapshot.revision`; returns 409 on mismatch
- `GET /api/v1/integrations/:id/audit` — local audit log for this integration (origin: 'local' entries)

The local snapshot has a `revision` counter that acts as a CAS token. A draft session captures `baseRevision` at fetch time. Before apply, `review-store.ts` re-reads the snapshot and checks that `baseRevision === snapshot.revision`; if not, the apply is rejected with a stale-draft error.

The server-side CAS check in `local-handlers.ts` is the authoritative boundary:

```typescript
if (body.expectedRevision !== snapshot.revision) {
  return HttpResponse.json(
    {
      error: 'Conflict',
      message: 'Local snapshot revision has changed. Fetch the latest preview before applying.',
    },
    { status: 409 },
  );
}
```

## Persistence

All state — integration store, draft sessions, local snapshots, local audit log — lives in JavaScript module-level memory. It:

- Resets on page reload
- Is shared across the MSW service worker lifetime during a session
- Is not persisted across page reloads in the current MSW-backed implementation. In production, these endpoints are backed by the real server, providing durability across sessions and operators.

HubSpot (id=2) is seeded with 5 pending review items to demonstrate the conflict review flow without needing a live API call.

## SSR Posture

All sync-console routes use `ssr: false`. The app uses TanStack Start as the SSR framework, but data loading currently depends on browser-side MSW which is unavailable during server-side rendering. Follow-up work is tracked in `portier-sync-7mc` and `portier-sync-s2c`.

## Docker Behavior

The Docker container runs `bun run serve` (Vite preview) on port 3001. The browser downloads and starts the MSW service worker on first load. Both runtime modes are available in the container; set `VITE_MOCK_API=true` at build time if fully mocked behavior is needed.

## Known Follow-ups

- `portier-sync-7mc` — design proper SSR/MSW architecture and remove `ssr: false`
- `portier-sync-s2c` — dual browser/server MSW bootstrap (in-progress on separate branch)
- `portier-sync-q5b.4` — move review classification from client heuristics to backend-owned payload