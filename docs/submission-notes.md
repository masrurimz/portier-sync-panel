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

## Architectural decisions

The brief evaluates five dimensions. Each design decision below maps to one or more of them.

### Separation of UI, business logic, and API interaction

Three independent layers, enforced by TypeScript import direction:

**API layer** (`packages/api/`): The only place network I/O occurs. `api-contract.ts` defines every endpoint with Zod schemas for query params, output, and error payloads. `better-fetch` validates both success and error responses against those schemas before returning them to any caller. Query factories in `queries/` are thin TanStack Query wrappers over the typed client — no business logic, no UI imports.

**Business logic layer** (`-domain/`): Pure TypeScript, no React, no network calls, no side effects. Owns the domain model — `ReviewItem`, `DraftSession`, `ReviewResolution`, `SyncFetchError` — and the pure functions that transform between them (`buildBatchFromApi`, `pendingItems`, `normalizeApiError`). Can be exercised in Node with no browser globals.

**State layer** (`-state/`): Zustand store that orchestrates calls between the API layer and the domain layer. `syncNow()` calls `$fetch`, passes the result to `buildBatchFromApi`, stores the resulting `DraftSession`. Nothing at this layer has awareness of routing or rendering.

**UI layer** (page components): Reads from query cache and Zustand store. Calls domain helpers for formatting/filtering and store actions for mutations. No direct API calls in any component.

### Clean and maintainable code structure

Feature-first with explicit visibility conventions:

- `features/sync-console/` contains all sync workflow logic. Nothing leaks into route files or global state.
- The `-` prefix on `-domain/`, `-state/`, `-components/` marks them as internal cross-cutting modules — not imported directly by other features.
- `features/sync-console/index.ts` exports only four page components. All types, stores, and utilities stay inside the feature boundary.
- Route files (`apps/web/src/routes/`) contain only `createFileRoute` + a single component render. All logic is one import away in the feature directory.
- `packages/api` makes it structurally impossible to add a fetch call without updating the contract, the fetch schema, and a query factory. Ad-hoc fetches cannot exist.

### Loading and error states

Four error categories with distinct copy and affordances:

| HTTP status | Error code | User-facing title | Retryable |
|---|---|---|---|
| 4xx | `missing_configuration` | Configuration required | No |
| 502 | `provider_unavailable` | Provider unavailable | Yes |
| 5xx | `server_error` | Server error | Yes |
| Network/unknown | `network_error` | Could not reach Portier | Yes |

Normalization happens in `-domain/errors.ts` (`normalizeApiError`) before any error reaches the UI. The `retryable` flag drives whether a retry action is offered. Components only ever see `SyncFetchError` — no `instanceof` checks, no raw HTTP codes in render paths.

Loading states use React Suspense (`useSuspenseQuery`) for data fetching and explicit `DraftStatus` transitions for the review lifecycle:

```
idle → fetching → ready → applying → applied
                       ↘ stale
                       ↘ failed
```

Each state renders a distinct UI — no single `isLoading` boolean that collapses multiple distinct states into one.

### Thoughtful UX for sync and conflict resolution

The conflict resolution flow is modeled on `git add -p`:

The non-obvious question is why this model rather than the two simpler alternatives. **Approve-all / reject-all** forces a binary decision on the entire batch. When individual fields have independent correctness — a phone number change that is clearly right, a role escalation that needs verification — a batch-level decision forces the operator to choose the lesser evil and then manually correct the rest. The brief's own example (`john@company.com` vs `j.smith@newdomain.com`) is a case where neither the email nor the role field has an obviously correct answer independent of the other.

A **wizard** forces a linear path through every item in sequence. Operators have uneven confidence across fields: they may know immediately that a display name change is fine but need to check a policy before deciding on a role change. Forcing sequential order adds friction and offers no way to defer uncertain items while resolving certain ones.

**Atomic commit matters specifically for access control operations.** A role change from `viewer` to `admin` that is partially applied — some fields updated, others not — can leave the system in an inconsistent state that is harder to detect and correct than no change at all. The Apply button being disabled until all items are resolved is not a UX convenience; it is a correctness guarantee.

Choosing `git add -p` semantics is the non-obvious design choice. The first-draft solution would be approve-all or a checkbox list. Modeling the workflow on patch-by-patch staged changes requires understanding the operator's actual work pattern and the risk profile of the operation, not just what was fastest to build.

| Git analogy | Sync console equivalent | Implementation |
|---|---|---|
| `git fetch origin` | Sync Now button | `syncNow()` calls real API, builds `DraftSession` |
| `git status` output | ReviewPage staged-changes list | `pending` group (no decision) + `resolved` group (decided) |
| `git add -p` per-hunk choice | Per-field decision buttons | `updateReviewDecision()` mutates exactly one `ReviewItem.resolution`, leaves all others untouched |
| `git commit` | Apply button + confirmation modal | `applyReview()` — enabled only when all items are resolved; modal states explicitly this writes to local DB only |
| commit log | History page | Merged remote events + local `AuditEntry` with `origin: 'local'` |

After each decision, focus auto-advances to the next pending item — same workflow as `git add -p` accepting/skipping each hunk. The confirmation modal says exactly what will happen and cannot be bypassed.

This directly satisfies the brief's four stated properties: **safe** (nothing applied until all decided), **transparent** (each decision is visible before confirming), **reviewable** (decisions can be revised before apply), **auditable** (every apply writes an immutable `AuditEntry`).

### Reasonable frontend architecture

- **Contract-first API layer**: `api-contract.ts` is the single source of truth for every endpoint shape. Types flow from contract → fetch schema → query factory → component. The contract also declares error schemas per status code, so error handling is as typed as success handling.
- **TanStack Start**: SSR-capable framework with file-based routing and router-integrated query preloading. Current `ssr: false` is a known temporary limitation; the framework choice anticipates server rendering once MSW bootstrap is resolved (`portier-sync-7mc`).
- **MSW for scaffolding over a fake Node server**: MSW runs in the actual browser service worker layer, so request/response lifecycle is identical to a real API — error codes, timing, and schema validation all behave the same. The real-vs-mocked boundary is explicit in code (`localWorker` vs `worker`), not in configuration.
- **Zustand for review state, TanStack Query for server state**: TanStack Query owns server state (integrations list, history). The shared cache means the overview, detail, and review pages all subscribe to the same query key — invalidating `integrationsKeys.detail(id)` propagates to every subscriber automatically without the pages knowing about each other. Zustand owns operator session state: the draft lifecycle, per-field decisions in progress, and review status transitions. This state has a different owner (the operator's current work session) and a different lifetime (intentionally resets on reload until server-side persistence is available). Mixing it with the HTTP cache would conflate two distinct concerns with different staleness semantics. The boundary is structural, not conventional: TQ components call `useSuspenseQuery`, Zustand components call `useReviewStore`. No component crosses the boundary. This means either layer can evolve independently — moving draft state to server-side persistence does not change any TQ query, and changing the cache staleness policy does not touch the Zustand store.

### Product engineering decisions

Two decisions in this project are product-level, not implementation-level — they reflect choices about the operator's mental model and the system's ownership model.

**Priority queue above the integration inventory.** An ops console's primary job is to surface what needs attention, not to list everything that exists. The priority queue at the top of the overview shows only integrations in `conflict` or `error` state — the ones that are actively blocking operator work or indicate a degraded provider. A `conflict` status means an incoming sync batch is staged and waiting for decisions; the longer it waits, the larger the divergence between systems grows. An `error` status means the provider is degraded and cannot be synced; the operator needs to know this without scanning a table. A flat alphabetical list works for six integrations; it does not scale to sixty. The priority queue rule lives in `getPriorityIntegrations()` in `-domain/integration.ts` — it is a pure function, not inline JSX. When the rule changes (for example, adding 'syncing for more than five minutes' as a priority condition), it changes in one place and the overview renders the correct set without any component modification.

**Planned server-side review classification (portier-sync-q5b.4).** The current `buildBatchFromApi()` function classifies sync changes by value inequality: if `current_value !== new_value`, the change requires review. This is a heuristic, not a policy. It cannot distinguish a phone number change from a role escalation to `admin`, both of which produce a `current_value !== new_value` result. Business rules for what requires operator approval — and at what risk level — belong on the backend, where the semantic meaning of fields is known and where the policy is authoritative. If the classification lives in the UI, every new client (mobile app, CLI tool, API consumer) must re-implement the same rules independently and risk drift. The planned work requires a backend contract change: the sync preview response needs to carry `review_required` and `risk_level` per change. The real Portier API does not currently return that metadata, so this is tracked as future work rather than shipped today.

## What would come next

These are documented follow-ups, not shipped:

- `portier-sync-7mc` — SSR/MSW dual-mode architecture so routes can be server-rendered
- `portier-sync-s2c` — dual browser/server MSW bootstrap (in-progress on a separate branch)
- `portier-sync-q5b.4` — move review classification from client heuristics to backend-owned payload
- `portier-sync-0jh` — migrate `syncNow` from Zustand action to TanStack `useMutation`