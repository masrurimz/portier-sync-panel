# UI Patterns for Sync Panel

Based on research from Salesforce, HubSpot, Stripe, and production codebases.

---

## Conflict Resolution Patterns

### Salesforce: Merge Modes

```typescript
type MergeMode = 
  | 'overwrite'              // Force local, no comparison
  | 'merge_accept_yours'     // Merge both, prefer local
  | 'fail_on_conflict'       // Fail if same field changed both sides
  | 'fail_on_any_change';    // Fail if ANY field changed remotely
```

### Conflict Report Structure

```typescript
interface ConflictReport {
  base: Record<string, unknown>;     // Originally fetched
  theirs: Record<string, unknown>;   // Latest from server
  yours: Record<string, unknown>;    // Local modifications
  remoteChanges: string[];           // Fields that changed remotely
}
```

---

## Field-Level Resolution UI

### Resolution Actions

```typescript
type ResolutionAction = 
  | { type: 'keep_ours' }
  | { type: 'keep_theirs' }
  | { type: 'skip' }
  | { type: 'abort' };
```

### Three-Pane Diff (Recommended)

```
┌─────────────┬─────────────┬─────────────┐
│   Remote    │   Result    │    Local    │
│  (theirs)   │  (editable) │   (ours)    │
│             │             │             │
│ john@new.co │ [choose]    │ john@old.co │
└─────────────┴─────────────┴─────────────┘
```

---

## Sync Operation States

```typescript
type SyncOperationState =
  | { type: 'idle' }
  | { type: 'preparing' }
  | { type: 'reviewing'; changes: SyncChange[] }
  | { type: 'applying'; progress: number }
  | { type: 'completed'; version: string }
  | { type: 'error'; code: string; message: string };
```

---

## Review-Before-Apply Workflow

### Key UX Elements

1. **Per-change selection** - Accept/reject individual changes
2. **Bulk controls** - Select All / Deselect All
3. **Selection counter** - "5 of 12 changes selected"
4. **Progress feedback** - During sync operation
5. **Result summary** - Success with new version

### Change Item State

```typescript
interface ReviewChangeItem {
  id: string;
  fieldName: string;
  changeType: 'UPDATE' | 'ADD' | 'DELETE';
  currentValue?: string;
  newValue?: string;
  selected: boolean;  // User's approval decision
}
```

---

## Version History Display

### Entry Structure

```typescript
interface VersionHistoryEntry {
  id: string;
  timestamp: Date;
  source: 'user' | 'system';
  version: string;
  summary: string;
  details?: string;
  stats: {
    added: number;
    updated: number;
    deleted: number;
  };
}
```

### Accordion Pattern

```
▼ Mar 2, 2026 08:30:00 | system | v2.4.1 | Automatic sync completed
  └─ Updated 234 records, added 12 new entries

  Mar 2, 2026 04:30:00 | system | v2.4.0 | Automatic sync completed

  Mar 1, 2026 20:30:00 | user   | v2.3.9 | Manual sync triggered
```

---

## Status Indicators

```typescript
const STATUS_CONFIG = {
  synced:    { color: 'green',  label: 'Synced',    icon: CheckCircle },
  syncing:   { color: 'blue',   label: 'Syncing',   icon: Loader },
  conflict:  { color: 'yellow', label: 'Conflict',  icon: AlertTriangle },
  error:     { color: 'red',    label: 'Error',     icon: XCircle },
};
```

---

## Error Handling

### Error States

| Code | HTTP | UI Message |
|------|------|------------|
| `missing_parameter` | 400 | "Configuration required" |
| `invalid_application_id` | 400 | "Invalid integration" |
| `internal_error` | 500 | "Server error - please retry" |
| Gateway error | 502 | "Integration unavailable" |

### Retry Strategy

- Show retry button for 5xx errors
- Auto-retry syncing state (with progress)
- Clear error state on successful retry

---

## Component Checklist

### Core Components
- [ ] `IntegrationsList` - Table with status badges
- [ ] `IntegrationCard` - Summary with sync button
- [ ] `SyncHistory` - Accordion timeline
- [ ] `ReviewChanges` - Selection/diff view
- [ ] `ChangeItem` - Individual change with diff
- [ ] `StatusBadge` - Status indicator
- [ ] `SyncButton` - Triggers sync with loading state

### UI Primitives (add via shadcn)
- [ ] `Table` - For integrations list
- [ ] `Badge` - Status indicators
- [ ] `Accordion` - History entries
- [ ] `Dialog` - Confirmations
- [ ] `Tabs` - Navigation (optional)

---

## Performance Notes

- Virtualize long change lists (100+ items)
- Paginate sync history
- Cache integration data in TanStack Query
- Debounce search input
- Show skeleton during initial load