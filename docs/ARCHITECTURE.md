# Sync Console Architecture Decisions

Last updated: 2026-03-21 (redesign complete through bead .15)

This document records architecture decisions implemented for:
- `portier-sync-3gh` (folder structure reshape)
- `portier-sync-czc` (state management overhaul)
- `portier-sync-4l7.*` (sync product redesign: domain model, local MSW DB, orchestration, page UX, history provenance)

Use this as the canonical reference for feature structure, state ownership, and why these decisions were made.

---

## 1) Folder Layer Convention

### Rule
Inside `features/`, **infrastructure layers** use a `-` prefix; **page/feature sections** do not.

Examples in `apps/web/src/features/sync-console/`:
- Layers: `-api/`, `-domain/`, `-state/`, `-ui/`
- Sections: `overview/`, `detail/`, `history/`, `review/`

Nested review section follows the same rule:
- Layers: `review/-forms/`, `review/-ui/`
- Section entry: `review/page.tsx`

### Rationale
Without a visual convention, layered and section directories looked identical, which made navigation ambiguous.

The `-` prefix gives immediate clarity:
- dash = cross-cutting feature layer
- no dash = user-facing page/section

It also sorts layer folders before section folders alphabetically, so feature internals are discoverable first.

### Scope
This convention applies inside `features/` slices.
It does **not** rename top-level app directories like `routes/`, `components/`, or `app/`.

---

## 2) State Ownership Model

| Data | Owner | Reason |
|---|---|---|
| `integrations[]` | TanStack Query | Server state; canonical source should remain query cache |
| `history[]` | TanStack Query | Server state; optimistic append via `queryClient.setQueryData` after apply |
| `reviewBatches` | Zustand store (`useReviewStore`) | Mutable UI workflow state from sync preview |
| `syncErrors` | Zustand store (`useReviewStore`) | Transient per-integration UI error state |
| `syncingId` | Zustand store (`useReviewStore`) | In-flight indicator for sync operations |
| filter/search UI | local `useState` | Ephemeral page-scoped interaction state |
| form values | TanStack Form | Field-level form state and validation lifecycle |

---

## 3) ADR-001 — Zustand over useReducer / Jotai

**Status:** Accepted and implemented

### Context
`SyncSessionProvider` had become a monolithic React Context layer that held both server-like and UI state. Any mutation recreated the context value and widened re-render impact.

### Decision
Use a Zustand store with `immer` middleware (`features/sync-console/-state/review-store.ts`) for mutable review workflow state.

### Alternatives considered
- **useReducer in Context** — rejected: improves action organization but keeps Context broadcast re-render behavior.
- **Jotai** — rejected: atom-per-entity approach adds complexity for this `Record<IntegrationId, T>` action-oriented workflow.

### Consequences
- Narrow hooks are now available (`useSyncingId`, `useReviewBatch`, `useSyncError`, `useReviewActions`).
- Update logic lives in store actions; page components stay orchestration-focused.
- Nested updates are explicit and concise through `immer`.

---

## 4) ADR-002 — Server State Stays in TanStack Query

**Status:** Accepted and implemented

### Context
The previous provider duplicated `integrations[]` into local React state and maintained a merge effect to reconcile local mutations and remote query refreshes.

### Decision
Remove duplicated integration/history state from feature provider logic.

- Pages read integrations/history from TanStack Query.
- Store actions patch query cache when needed for honest optimistic UI:
  - integration status/version updates
  - history append after `applyReview`

### Consequences
- Single source of truth for server data.
- Removed local merge complexity and sync drift risk.
- Query cache updates are explicit and colocated with mutation actions.

---

## 5) ADR-003 — TanStack Form Composable Pattern Retained

**Status:** Accepted (existing pattern retained)

### Context
Review resolution form already used `createFormHook` + `createFormHookContexts` with field/form component composition.

### Decision
Keep current TanStack Form composition model.

### Consequences
- No migration churn for forms.
- Future growth path remains: extract shared `formOptions` under `review/-forms/` when additional forms are introduced.

---

## 6) Dead Code Removed

The following were removed as obsolete after architecture cutover:

- `apps/web/src/lib/api-types.ts`
  - Superseded by `@portier-sync/api` schema/query exports.
- `apps/web/src/lib/sync-console-store.tsx`
  - Facade with no external consumers.
- `apps/web/src/app/providers/sync-session-provider.tsx`
  - Pass-through wrapper with no additional behavior.
- `apps/web/src/features/sync-console/-state/sync-session-provider.tsx`
  - Replaced by Zustand store.
- Provider-only dead state `activePreviewId`
  - Eliminated with provider removal.
- Empty placeholders:
  - `packages/api/src/contract/`
  - `packages/ui/src/hooks/`

---

## 7) Implementation Notes

- Router creates a fresh `QueryClient` in `getRouter` (request-safe SSR pattern) and no longer wraps with a feature provider.
- Review store actions receive `queryClient` from call sites (`useQueryClient`) instead of reading a module-level singleton.
- Integration header/status surfaces consume TanStack Query data directly.
- Review workflow mutation actions are centralized in Zustand store and patch query cache as needed.
- Sync preview state is not manually seeded into TanStack Query from review batches.
- Sync in-flight tracking is per integration via `DraftSession.status === 'fetching'`; no separate `syncingById` map.
- `applyReview` calls `applyLocalReview` from `@portier-sync/api` which writes to the MSW-backed local DB. It does NOT inject into the remote history query cache; local history is served by `getLocalHistory`.
- Stale detection compares `draft.baseVersion` against `localSnapshot.localVersion` (NOT `integration.version`). The baseline for comparison is the local DB version, not the remote version.
- The `-api/` feature wrapper layer has been deleted. All API calls use `@portier-sync/api` directly from pages and the review store. Only feature-local layer remaining is `-domain/errors.ts` (error normalization).


---

## Domain Model (bead .9)

Three distinct sources of truth must never be blurred in code or UI:

| Layer | Type | Owner | Resets? |
|---|---|---|---|
| Remote truth | `Integration`, `SyncHistoryEntry` | TanStack Query | on invalidation |
| Local truth | `LocalSnapshot`, `AuditEntry` (local) | MSW local DB | on app start |
| Operator draft | `DraftSession` | Zustand store | on apply/reset |

### Canonical types added in .9
- `LocalSnapshot` — locally-accepted state per integration (feature domain)
- `PreviewSession` — immutable remote preview payload, never mutated (feature domain)
- `DraftSession` — mutable operator review state, valid only while `localVersion === baseVersion` (feature domain)
- `AuditEntry` — provenance-aware unified history event: `origin: 'remote' | 'local' | 'future-push'` (shared schema package)
- `IntegrationOperatorStatus` — 7-state product lifecycle enum, separate from remote `SyncStatus` (shared schema package)
- `SyncFetchError` — moved from `-api` to `-domain/errors.ts`

### Invariants
1. `DraftSession` with `status !== 'stale'` requires `LocalSnapshot.localVersion === DraftSession.baseVersion`.
2. `AuditEntry` with `origin: 'local'` MUST NOT be rendered as remote-confirmed history.
3. `PreviewSession.items` are immutable after creation; operator decisions live only in `DraftSession.items`.

---

## Redesign Summary (beads .9–.15)

### What changed
1. **Domain types** — `LocalSnapshot`, `PreviewSession`, `DraftSession`, `AuditEntry`, `IntegrationOperatorStatus` defined; `SyncFetchError` moved to `-domain/errors.ts`.
2. **Local MSW DB** — explicit in-memory local database in `packages/api/src/msw/data/local-*.ts` with handlers in `local-handlers.ts`. Endpoints: `GET /local/integrations/:id/snapshot`, `PUT /local/integrations/:id/apply-review`, `GET /local/history`. Consumer transport: `getLocalSnapshot`, `applyLocalReview`, `getLocalHistory` from `@portier-sync/api`.
3. **Orchestration** — `syncNow` reads `localSnapshot.localVersion` as `DraftSession.baseVersion`. `applyReview` is async and calls `applyLocalReview`. Thin `-api/` wrappers deleted.
4. **Overview** — `OperatorStatusBadge` with 7 states; dynamic CTAs (`Fetch latest` / `Continue review` / `Refresh draft`); pending count from draft session.
5. **Detail** — local snapshot metadata panel (version, record count, last updated); stale draft warning when `draft.status === 'stale'`.
6. **Review** — immutable context banner (applicationName, baseVersion, proposedVersion, fetchedAt); three sections (`Conflicts needing decision` / `Resolved conflicts` / `Ready to apply`); `Apply locally` button and dialog; stale blocking alert; `Keep local` / `Accept remote` / `Custom value` decision labels.
7. **History** — unified timeline merging remote history + local audit entries sorted by timestamp; `Remote` / `Local` provenance badge per row; normalization via `remoteHistoryToAuditEntry`.

### Still open (future backend work)
- No remote apply/push endpoint exists. `applyLocalReview` writes to local MSW DB only and does not persist to the real backend.
- `Applied locally` state persists until next fetch for that integration or app reset (local DB is in-memory only and resets on every app start).
- Multi-remote stale cascade (applying Remote A staleing B/C/D drafts) is enforced at apply time via baseVersion check but not proactively surfaced in the overview.
- `PreviewSession` type is defined but not yet used as a distinct immutable snapshot object; preview data lives inside `DraftSession.items`.