# Submission Notes

## Brief compliance

| Brief requirement | Status | Notes |
| --- | --- | --- |
| Integrations list with status indicators | Implemented | 6 integrations; synced/syncing/conflict/error states |
| Integration detail + Sync Now trigger | Implemented | Detail page with metrics, reliability banner, Sync Now |
| Sync Now calls real API | Implemented | `GET https://portier-takehometest.onrender.com/api/v1/data/sync` |
| Preview incoming changes before applying | Implemented | Review queue with field-level comparison |
| Conflict resolution (per-field, side-by-side) | Implemented | keep local / accept external / edit merged |
| Sync history with version tracking | Implemented | Timeline merged from modeled events + local apply entries |
| Loading states | Implemented | Skeleton loaders, pending indicators |
| Error handling — 4xx, 500, 502 | Implemented | Mapped to distinct copy and actions |
| Docker | Implemented | Single Dockerfile, Vite preview on port 3001 |

## Scope decisions and assumptions

- The brief specifies only `GET /api/v1/data/sync` as the required real endpoint. All other data surfaces (integrations inventory, history, draft review persistence) are modeled locally because no corresponding backend API exists.
- Choosing MSW over a fake backend means the frontend behavior is grounded in the real service worker interception model rather than a stand-in Node server that would not exist in a real product.
- Apply/confirm behavior is intentionally local-only. Because no remote write endpoint is provided, confirmation records a local audit entry with `origin: 'local'` so history provenance remains truthful. No apply event is labeled as a remote-confirmed sync.
- Review draft state (field decisions in progress) is Zustand in-memory. It persists across navigations within a session but resets on page reload. This is consistent with the absence of a backend session store.
- HubSpot (id=2) is pre-seeded with 5 pending review items to let reviewers exercise the conflict resolution flow immediately without triggering a live API call.
- Stripe (id=3) and Zendesk (id=5) start in a degraded/unreachable provider state to demonstrate the 502/504 error paths.

## Known limitations

- Sync-console routes use `ssr: false` because browser-side MSW is not available during server-side rendering. TanStack Start is the SSR framework in use, but this capability is not currently active on these routes.
- Review draft state resets on page reload (in-memory MSW store).
- Integration metadata (version, record count, providerHealth) is seeded; it does not reflect a real database.
- The `integrationHealthSeed` helper in the detail page still provides some fabricated metadata that will be replaced once proper API-backed status is available (`portier-sync-rof`).

## Stack rationale

- **TanStack Start** over plain Vite SPA: demonstrates file-based routing, SSR-capable architecture, and router-integrated query preloading even if SSR is currently off on these routes.
- **MSW v2** for scaffolding: allows realistic API interaction patterns (request/response shape, error codes) without a fake server, and makes the real-vs-mocked boundary explicit in code rather than in configuration.
- **packages/api** shared package: keeps API schemas, query factories, and MSW handlers co-located and typed so the web app cannot drift from the contract.
- **better-fetch** over raw fetch: provides schema-validated, throw-on-error behavior that integrates cleanly with TanStack Query's error boundary model.
- **Zustand + Immer** for review state: session-scoped, non-server state with simple immer mutations; TanStack Query is reserved for server state only.

## What would come next

These are documented follow-ups, not shipped:

- `portier-sync-7mc` — SSR/MSW dual-mode architecture so routes can be server-rendered
- `portier-sync-s2c` — dual browser/server MSW bootstrap (in-progress on a separate branch)
- `portier-sync-q5b.4` — move review classification from client heuristics to backend-owned payload
- `portier-sync-0jh` — migrate `syncNow` from Zustand action to TanStack `useMutation`