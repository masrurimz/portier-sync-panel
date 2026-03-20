# Sync Console UX Blueprint

This document replaces the older generic UI notes with a more opinionated direction for the Portier take-home app.

The goal is not to mirror the reference site. The goal is to design a sync workflow that feels safe, transparent, reviewable, and auditable.

---

## Product Posture

Treat this UI as an operations console, not a marketing dashboard.

Users are making trust-sensitive decisions:
- deciding whether to pull in external changes
- resolving ambiguous conflicts
- understanding what changed and why
- confirming a merge that may affect real people, doors, and keys

That means the interface should optimize for:
- decision clarity
- status truthfulness
- traceability
- low ambiguity
- fast orientation under failure

It should not optimize for ornamental minimalism.

---

## Recommended Information Architecture

### 1. Integrations Overview
Purpose: help the user identify what needs attention right now.

Recommended sections:
- global header with product name and sync health
- top summary strip with counts and latest system health
- priority review queue for integrations needing action
- searchable/filterable integrations table

Required table columns:
- integration
- status
- pending review count
- last sync
- version
- action

Why this shape:
- status alone is not enough; users need to know whether action is required
- the priority queue reduces scanning time when one integration blocks trust

### 2. Integration Detail
Purpose: orient the user before they trigger or review sync.

Recommended sections:
- integration header with status, version, and Sync Now action
- reliability banner with API/source health signals
- metrics row
- incoming changes preview
- tabs for Overview, Review Queue, History, Settings

Recommended metrics:
- total records
- pending updates
- unresolved conflicts
- last sync duration
- audit retention

Why this shape:
- users need to understand sync context before acting
- history and review should stay close to the trigger surface

### 3. Review and Conflict Resolution
Purpose: make every approval intentional.

Recommended layout:
- review header with counts for total changes, safe changes, and conflicts
- action toolbar for retry/export/bulk safe approval
- left rail for grouping changes by entity or severity
- main detail pane for focused review
- sticky footer showing unresolved conflicts and final action

Per-field actions:
- keep local
- accept external
- edit merged value

Why this shape:
- true conflicts deserve a focused review surface, not a generic checklist
- separating safe updates from conflicts reduces cognitive load

### 4. History and Audit
Purpose: prove what changed after the fact.

Recommended layout:
- filterable timeline or expandable event list
- each event should show trigger, actor, version, result, and changed fields
- expanded event should show before/after context where possible

Why this shape:
- a plain table is a log, not an audit tool
- the user should be able to answer what changed, who approved it, and when

---

## Interaction Principles

### Risk-first presentation
When conflicts exist, show them before low-risk changes.

### One decision at a time
The focused pane should reduce split attention. Make the current field obvious.

### Tell the truth about uncertainty
If the API timed out or returned incomplete data, the UI should say so directly.

### Preserve audit context near the decision
When possible, show:
- source system
- last modified time
- who changed it
- entity path
- change type

### Avoid fake certainty
Do not imply that the system knows the correct winner in an ambiguous conflict.

---

## Status Model

Use consistent semantics across overview, detail, and history.

| Status | Meaning | UI treatment |
|---|---|---|
| Synced | Last sync completed and no review is required | calm positive badge |
| Syncing | Fetch/apply is in progress | active animated badge or inline progress |
| Conflict | Sync completed with ambiguous fields requiring review | prominent warning badge and pending count |
| Error | Sync could not complete or source is unavailable | destructive badge with retry path |

Supplemental health signals:
- source healthy
- degraded
- timed out
- pending approval
- partially applied

---

## Error State Guidelines

### 4xx
Interpret as configuration or request issue.

User message should answer:
- what is wrong
- whether the user can fix it
- what action to take next

Example treatment:
- banner: "This integration is not fully configured. Sync preview cannot be generated."
- actions: Review configuration, Retry

### 500
Interpret as server failure.

Example treatment:
- banner: "Portier could not prepare a sync preview right now. No changes were applied."
- actions: Retry sync, View last successful sync

### 502 / provider unavailable
Interpret as external dependency failure.

Example treatment:
- banner: "The provider is temporarily unavailable. Your local data has not changed."
- actions: Retry later, Inspect history

Important:
- always state whether any data was applied
- never blur failure into a successful-looking state

---

## Review Surface Recommendations

### Change grouping
Group changes by:
- entity type: User / Door / Key
- severity: Safe / Conflict / Deletion
- optionally record or object id

### Field row contents
Each focused field should include:
- display label
- field path
- change type
- local value
- external value
- provenance metadata
- chosen resolution

### Safe updates
Safe updates can be bulk-approved, but should still be inspectable.

### Conflicts
Conflicts must require an explicit decision before apply.

### Final apply control
The primary action should reflect state truthfully:
- Apply 5 approved changes
- Resolve 2 conflicts to continue
- Retry preview

---

## History Surface Recommendations

Each event should expose:
- timestamp
- version
- source or actor
- trigger type
- result
- changed entities
- counts of added, updated, deleted, conflicted fields

Expanded state can include:
- before and after values
- approval notes
- link back to the reviewed sync batch

---

## Recommended Wireframes

### Integrations Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Portier Sync Console                         Search   Alerts(2)      │
├──────────────────────────────────────────────────────────────────────┤
│ 6 integrations   2 need review   1 degraded   Last full sync 08:30  │
├──────────────────────────────────────────────────────────────────────┤
│ Priority Review                                                    │
│ HubSpot has 4 unresolved field conflicts              [Review now] │
├──────────────────────────────────────────────────────────────────────┤
│ Filters: [search........] [status v] [entity v] [source health v]   │
├──────────────────────────────────────────────────────────────────────┤
│ Integration   Status     Pending   Last Sync     Version   Action    │
│ Salesforce    Synced     0         2m ago        v2.4.1    View      │
│ HubSpot       Conflict   4         18m ago       v1.8.3    Review    │
│ Stripe        Error      -         Failed        v3.1.0    Retry     │
│ Slack         Syncing    2         Running...    v1.2.5    Open      │
└──────────────────────────────────────────────────────────────────────┘
```

### Integration Detail

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Integrations                                                      │
│ Salesforce                            Synced   v2.4.1   [Sync Now]  │
├──────────────────────────────────────────────────────────────────────┤
│ Source healthy • Last run 45s • Next scheduled 14:00 • API reachable│
├──────────────────────────────────────────────────────────────────────┤
│ Records        Pending Updates   Unresolved Conflicts   Audit Retain │
│ 12,453         5                 0                      90 days       │
├──────────────────────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Review Queue] [History] [Settings]                │
├──────────────────────────────────────────────────────────────────────┤
│ Incoming Changes Preview                                            │
│ - 3 User updates                                                    │
│ - 1 Door status change                                              │
│ - 1 Key revocation                                                  │
│                                                     [Review changes] │
└──────────────────────────────────────────────────────────────────────┘
```

### Review and Conflict Resolution

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Salesforce Review                         7 changes • 4 conflicts          │
│ [Approve safe changes] [Export diff] [Retry fetch]                        │
├───────────────────────────────┬────────────────────────────────────────────┤
│ Change Groups                 │ Focused Review                             │
│                               │                                            │
│ Users (3)                     │ Field: User Email                          │
│ Doors (2)                     │ Risk: Conflict                             │
│ Keys (2)                      │ Reason: Changed in both systems            │
│                               │                                            │
│ > User.email                  │ Local value                                │
│ > User.phone                  │ john@company.com                           │
│ > Door.status                 │ last edited by Admin • 09:12               │
│                               │                                            │
│                               │ External value                             │
│                               │ j.smith@newdomain.com                      │
│                               │ last edited by HubSpot • 09:15             │
│                               │                                            │
│                               │ Resolution                                 │
│                               │ ( ) Keep local                             │
│                               │ ( ) Accept external                        │
│                               │ ( ) Edit merged value                      │
│                               │ [ merged input.......................... ]  │
├───────────────────────────────┴────────────────────────────────────────────┤
│ 2 unresolved conflicts                                 [Apply decisions]   │
└────────────────────────────────────────────────────────────────────────────┘
```

### History and Audit

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Salesforce History                                  [Export audit]   │
├──────────────────────────────────────────────────────────────────────┤
│ Filters: [result v] [actor v] [date range v]                        │
├──────────────────────────────────────────────────────────────────────┤
│ v2.4.1  Mar 2, 08:30  System  Success   5 fields changed  [Expand]  │
│ v2.4.0  Mar 2, 04:30  System  Success   2 fields changed  [Expand]  │
│ v2.3.9  Mar 1, 20:30  User    Manual    1 field changed   [Expand]  │
├──────────────────────────────────────────────────────────────────────┤
│ Expanded event                                                       │
│ - Trigger: Manual sync                                               │
│ - Actor: zahid@company.com                                           │
│ - Changed fields: user.email, key.status                             │
│ - Before / after snapshot                                            │
│ - Approval notes                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Visual Direction

Recommended visual posture:
- dark operations-console theme
- high contrast
- restrained accent colors
- dense but readable information layout
- status colors used consistently, not decoratively
- typography optimized for scanning and trust

Avoid:
- consumer productivity app styling
- oversized empty cards
- ornamental gradients that compete with operational state
- minimalist layouts that hide context users need to decide safely

---

## Implementation Notes

This document is intentionally implementation-friendly.

Map it into reusable surfaces such as:
- `StatusBadge`
- `HealthBanner`
- `IntegrationTable`
- `ReviewQueue`
- `ConflictInspector`
- `HistoryTimeline`
- `AuditEventCard`

If the API is unstable, keep the UX honest:
- only Sync Now needs live fetch
- preview, history, and conflict states may be simulated locally
- error behavior should still feel production-ready
