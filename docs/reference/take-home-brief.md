# Take-Home Brief Reference

This document preserves the original take-home brief reference material (API documentation, data models, and evaluation criteria) for historical context. Current architecture and runtime behavior are documented in `docs/architecture.md`, `docs/runtime-modes.md`, and `docs/submission-notes.md`.

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

## Notes

- Visual polish is NOT the primary focus
- Focus on architecture, separation of concerns, UX
- Stripe and Zendesk APIs return 500 errors - handle gracefully
- No authentication required for the API
- CORS is enabled (`Access-Control-Allow-Origin: *`)