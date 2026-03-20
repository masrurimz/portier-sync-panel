# Portier Take-Home Test - Project Context

## Overview

Building a **Web App Integration Sync Panel** for a B2B SaaS platform that connects to multiple external services (Salesforce, HubSpot, Stripe, Slack, Zendesk, Intercom).

The system supports **bidirectional data synchronization** with structured conflict resolution.

---

## API Documentation

### Base URL
```
https://portier-takehometest.onrender.com
```

### Endpoint: Sync Data
```
GET /api/v1/data/sync?application_id={id}
```

#### Query Parameters
| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `application_id` | Yes | string | Integration ID |
| `limit` | No | number | Pagination limit |
| `offset` | No | number | Pagination offset |

#### Valid Application IDs
- `salesforce` ✅ Working
- `hubspot` ⚠️ Returns empty/times out
- `stripe` ❌ Returns 500 Internal Server Error
- `slack` ✅ Working
- `zendesk` ❌ Returns 500 Internal Server Error
- `intercom` ✅ Working

#### Response Structure

**Success Response:**
```json
{
  "code": "SUCCESS",
  "message": "successfully retrieve the data",
  "data": {
    "sync_approval": {
      "application_name": "Salesforce",
      "changes": [
        {
          "id": "change_001",
          "field_name": "user.email",
          "change_type": "UPDATE",
          "current_value": "alice@techcorp.com",
          "new_value": "alice.wong@techcorp.com"
        }
      ]
    },
    "metadata": {}
  }
}
```

**Error Responses:**

```json
// 400 - Missing application_id
{
  "error": "Bad Request",
  "code": "missing_parameter",
  "message": "query parameter 'application_id' is required"
}

// 400 - Invalid application_id
{
  "error": "Bad Request",
  "code": "invalid_application_id",
  "message": "unsupported application_id; valid values are: salesforce, hubspot, stripe, slack, zendesk, intercom"
}

// 500 - Internal Server Error
{
  "error": "Internal Server Error",
  "code": "internal_error",
  "message": "an unexpected server error occurred"
}
```

#### Change Types
| Type | Description | Fields |
|------|-------------|--------|
| `UPDATE` | Modify existing value | `current_value`, `new_value` |
| `ADD` | Create new record | `new_value` only |
| `DELETE` | Remove record | `current_value` only |

#### Field Naming Convention
Fields use dot-notation: `{entity}.{field}`
- `user.email`, `user.name`, `user.status`, `user.role`, `user.phone`
- `door.status`, `door.battery_level`, `door.last_seen`
- `key.status`, `key.key_type`, `key.access_end`, `key.id`

---

## Data Models

### User
| Field | Type | Values |
|-------|------|--------|
| id | UUID | |
| name | string | |
| email | string | |
| phone | string | |
| role | string | |
| status | string | `active`, `suspended` |
| created_at | timestamp | |
| updated_at | timestamp | |

### Door
| Field | Type | Values |
|-------|------|--------|
| id | UUID | |
| name | string | |
| location | string | |
| device_id | string | |
| status | string | `online`, `offline` |
| battery_level | int | |
| last_seen | timestamp | |
| created_at | timestamp | |

### Key
| Field | Type | Values |
|-------|------|--------|
| id | UUID | |
| user_id | UUID | |
| door_id | UUID | |
| key_type | string | |
| access_start | timestamp | |
| access_end | timestamp | |
| status | string | `active`, `revoked` |
| created_at | timestamp | |

---

## UX Direction

The provided Figma site is useful as a scope reference, but it is too minimal for a high-trust sync workflow.

Use it only as a baseline for page coverage. The product direction for this repo is an operations-oriented sync console with stronger review, conflict handling, and auditability.

### Recommended Views

1. **Integrations Overview** (`/`)
   - Searchable and filterable integrations table
   - Status indicators: Synced, Syncing, Conflict, Error
   - Pending review count per integration
   - Priority review queue for integrations requiring attention

2. **Integration Detail** (`/integration/:id`)
   - Integration summary with status, version, and Sync Now action
   - Reliability banner for source/API health
   - Metrics for records, pending updates, unresolved conflicts, and sync duration
   - Incoming changes preview
   - Tabs for Overview, Review Queue, History, Settings

3. **Review Sync Changes** (`/integration/:id/review`)
   - Triggered after Sync Now
   - Separate safe updates from true conflicts
   - Left-side grouping by entity type or severity
   - Focused field-level comparison with local vs external values
   - Per-field resolution: keep local, accept external, or edit merged value
   - Sticky footer with unresolved count and final apply action

4. **Sync History / Audit** (`/integration/:id/history`)
   - Filterable timeline or expandable event list
   - Columns or summary fields for timestamp, actor/source, version, result, and changed fields
   - Expanded event state for before/after details and approval notes

### UI Components Needed

- **Table** - Integrations overview and compact audit summaries
- **Card** - Summary metrics and health surfaces
- **Badge** - Status and severity indicators
- **Tabs** - Overview, review queue, history, settings
- **Button** - Sync, retry, approve, export actions
- **Checkbox / radio controls** - Field-level resolution actions
- **Diff View** - Focused comparison for local vs external values
- **Skeleton** - Loading states
- **Toast** - Async confirmations and errors
- **Banner / alert surface** - Configuration and upstream failure states

For layout, interaction, and wireframe guidance, treat `docs/UI_PATTERNS.md` as the source of truth.

---

## Tech Stack

### Framework
- **TanStack Start** - SSR framework with TanStack Router
- **TanStack Router** - File-based routing
- **TanStack Query** - Data fetching/caching

### Styling
- **TailwindCSS 4** - Utility-first CSS
- **shadcn/ui (base-lyra)** - Component library
- **Lucide React** - Icons

### Build Tools
- **Turborepo** - Monorepo management
- **Bun** - Package manager, runtime
- **Vite** - Build tool
- **Oxlint/Oxfmt** - Linting/formatting

### Deployment
- **Cloudflare Workers** via Alchemy
- **Docker** (required for submission)

---

## Project Structure

```
portier-sync/
├── apps/
│   └── web/                    # Main application
│       ├── src/
│       │   ├── routes/         # TanStack Router file routes
│       │   │   ├── __root.tsx  # Root layout
│       │   │   └── index.tsx   # Home page
│       │   ├── components/     # App-specific components
│       │   │   ├── header.tsx
│       │   │   └── loader.tsx
│       │   ├── router.tsx      # Router config
│       │   └── index.css       # Global styles
│       ├── package.json
│       └── components.json     # shadcn config
│
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # shadcn components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   └── sonner.tsx
│   │   │   ├── styles/
│   │   │   │   └── globals.css # Tailwind + CSS variables
│   │   │   ├── lib/
│   │   │   └── hooks/
│   │   ├── components.json
│   │   └── package.json
│   │
│   ├── env/                    # Environment config
│   ├── config/                 # Shared config
│   └── infra/                  # Infrastructure (Alchemy)
│
├── turbo.json                  # Turborepo config
├── package.json                # Root package
└── README.md
```

---

## Implementation Requirements

### Must Have
1. ✅ Integrations List with status indicators
2. ✅ Integration Detail view
3. ✅ "Sync Now" button calling the API
4. ✅ Sync History with version tracking
5. ✅ Conflict Resolution / Review Changes UI
6. ✅ Loading states
7. ✅ Error handling (4xx, 500, 502)
8. ✅ Docker support

### API Interaction
- Only "Sync Now" MUST call the real API
- Other data can be mocked/simulated

### Evaluation Criteria
1. Clear separation: UI / Business Logic / API
2. Clean, maintainable code structure
3. Proper loading/error state handling
4. Thoughtful UX for sync and conflicts
5. Reasonable frontend architecture

---

## Next Steps

### Phase 1: Foundation
1. Create TypeScript types for API responses
2. Set up API client with TanStack Query
3. Create mock data generators
4. Add missing shadcn components (table, badge, accordion, dialog, tabs)

### Phase 2: Core Features
1. Integrations List page
2. Integration Detail page
3. Sync History page
4. Review Changes page

### Phase 3: Polish
1. Loading states
2. Error handling
3. Animations/transitions
4. Docker setup

---

## Notes

- Visual polish is NOT the primary focus
- Focus on architecture, separation of concerns, UX
- Stripe and Zendesk APIs return 500 errors - handle gracefully
- No authentication required for the API
- CORS is enabled (`Access-Control-Allow-Origin: *`)