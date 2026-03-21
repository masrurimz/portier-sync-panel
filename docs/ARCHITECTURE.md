# Sync Console Architecture Decisions

Last updated: 2026-03-21

This document records architecture decisions implemented for:
- `portier-sync-3gh` (folder structure reshape)
- `portier-sync-czc` (state management overhaul)

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

- Query client is now shared via `apps/web/src/app/query-client.ts`.
- Router uses the shared client (`getAppQueryClient`) and no longer wraps with a feature provider.
- Integration header/status surfaces consume TanStack Query data directly.
- Review workflow mutation actions are centralized in Zustand store and patch query cache as needed.
