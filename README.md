# Portier Integration Sync Panel

A Web App Integration Sync Panel for a B2B SaaS platform that connects to multiple external services (Salesforce, HubSpot, Stripe, Slack, Zendesk, Intercom) with bidirectional data synchronization and conflict resolution.

## Features

- **Integrations List** - Overview of all connected integrations with status indicators (Synced, Syncing, Conflict, Error)
- **Integration Detail** - Summary view with sync statistics and "Sync Now" action
- **Sync History** - Version tracking with expandable history entries
- **Review Changes** - Preview incoming changes before applying with field-level comparison
- **Conflict Resolution** - Side-by-side comparison for resolving data conflicts

## Tech Stack

- **TanStack Start** - SSR framework with file-based routing
- **TanStack Query** - Data fetching and caching
- **TailwindCSS 4** - Utility-first CSS
- **shadcn/ui** - Component library (base-lyra style)
- **TypeScript** - Type safety
- **Turborepo** - Monorepo build system
- **Bun** - Package manager and runtime

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) (for containerized deployment)

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

## API

### Endpoint

```
GET https://portier-takehometest.onrender.com/api/v1/data/sync?application_id={id}
```

### Application IDs

| ID | Status |
|----|--------|
| `salesforce` | Working |
| `slack` | Working |
| `intercom` | Working |
| `hubspot` | Timeout |
| `stripe` | Error (500) |
| `zendesk` | Error (500) |

### Response Structure

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
          "current_value": "old@email.com",
          "new_value": "new@email.com"
        }
      ]
    }
  }
}
```

### Change Types

- `UPDATE` - Field modified (has `current_value` and `new_value`)
- `ADD` - New record created (has `new_value` only)
- `DELETE` - Record removed (has `current_value` only)

## Project Structure

```
portier-sync/
├── apps/
│   └── web/
│       └── src/
│           ├── routes/           # TanStack Router pages
│           ├── components/       # App-specific components
│           └── lib/              # Utilities and API client
├── packages/
│   ├── ui/                       # Shared shadcn/ui components
│   ├── env/                      # Environment config
│   └── config/                   # Shared TypeScript config
└── docs/                         # Project documentation
```

## Docker Deployment

### Build Image

```bash
docker build -t portier-sync .
```

### Run Container

```bash
docker run -p 3001:3001 portier-sync
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run check-types` | TypeScript type check |
| `bun run check` | Lint and format |

## Adding Components

Add shadcn components to the shared UI package:

```bash
npx shadcn@latest add table badge accordion dialog tabs -c packages/ui
```

Import in app:

```tsx
import { Button } from "@portier-sync/ui/components/button";
import { Card } from "@portier-sync/ui/components/card";
```

## Design Decisions

### Architecture

- **Separation of concerns**: UI components, business logic, and API calls are separated
- **Type safety**: Full TypeScript coverage with Zod validation
- **State management**: TanStack Query for server state, React state for UI state

### Error Handling

- 4xx errors show user-friendly configuration messages
- 5xx errors display retry options
- Loading states with skeleton components
- Toast notifications for async operations

### UX Considerations

- Review-before-apply workflow for all sync operations
- Per-change selection for granular control
- Version history for auditability
- Clear status indicators with color coding

## Documentation

- [Project Context](./docs/PROJECT_CONTEXT.md) - API constraints, system scope, and implementation context
- [UI Patterns](./docs/UI_PATTERNS.md) - Operations-console UX direction, interaction guidance, and wireframes
- [Google Stitch Prompt](./docs/GOOGLE_STITCH_PROMPTS.md) - Prompt set for generating the updated design direction

## License

MIT