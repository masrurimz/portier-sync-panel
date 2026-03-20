# Google Stitch Prompt

Use this prompt to generate a high-fidelity direction that matches the intended product behavior and UX posture for Portier.

This prompt is intentionally opinionated. It should produce an operations-focused sync console, not a generic SaaS dashboard.

---

## Primary Prompt

```text
Design a high-fidelity web application called "Portier Sync Console".

This is a B2B operations interface for reviewing and approving integration sync changes across systems like Salesforce, HubSpot, Stripe, Slack, Zendesk, and Intercom.

Do not design this as a minimalist productivity app or a marketing dashboard.
Design it as a high-trust operational review console.

Core product problem:
Data can change in both Portier and an external system at the same time. When that happens, the UI must not silently choose a winner. The user must be able to review differences, understand the risk, and make an explicit resolution.

Concrete conflict example:
- Local value: john@company.com
- External value: j.smith@newdomain.com
- The system cannot assume which value is correct
- The user must choose keep local, accept external, or edit a merged value

Primary design goals:
- safe
- transparent
- reviewable
- auditable
- operationally clear

Information architecture to design:

1. Integrations overview
- A top-level summary of integration health
- Search and filtering
- A priority review queue for integrations that need attention
- A table of integrations with:
  - name
  - status
  - pending review count
  - last sync time
  - version
  - action

2. Integration detail
- Integration identity, status, version
- Primary Sync Now action
- Source health / reliability banner
- Metrics such as total records, pending updates, unresolved conflicts, sync duration
- Incoming changes preview
- Tabs for Overview, Review Queue, History, Settings

3. Review and conflict resolution
- Distinguish safe changes from true conflicts
- Left-side navigation or grouping by entity type: User, Door, Key
- Main focused comparison pane for the selected field
- Show local value and external value side by side
- Show supporting metadata such as change type, field path, modified source, timestamp, or actor if available
- Per-field actions:
  - Keep local
  - Accept external
  - Edit merged value
- Sticky footer showing unresolved conflict count and final apply action

4. History and audit
- Timeline or expandable audit list
- Each event should show:
  - timestamp
  - actor or trigger source
  - result
  - version
  - changed fields summary
- Expanded state should reveal before/after context when appropriate

Required product states to show clearly:
- synced
- syncing
- pending review
- conflict
- no changes found
- success
- configuration issue
- internal server error
- provider unavailable / gateway failure

Error handling expectations:
- 4xx should feel like a configuration or request problem with a clear next step
- 500 should feel like an internal system failure, with reassurance that no silent apply happened
- 502 should feel like an upstream provider outage, with safe retry messaging

Data context:
Entities in the system include:
- User: id, name, email, phone, role, status, created_at, updated_at
- Door: id, name, location, device_id, status, battery_level, last_seen, created_at
- Key: id, user_id, door_id, key_type, access_start, access_end, status, created_at

UI direction:
- dark, operations-console aesthetic
- dense but readable
- high contrast
- restrained accent colors
- serious, trustworthy tone
- information-rich layouts over empty decorative whitespace

Avoid:
- generic AI SaaS look
- purple gradient hero styling
- floating glassmorphism cards with low information density
- over-minimal layouts that hide context needed for approval

Design priorities:
1. Decision clarity over visual novelty
2. Risk visibility over decorative simplicity
3. Auditability over cleverness
4. Fast scanning for operators managing multiple integrations

Output expectations:
- Produce a cohesive multi-screen direction
- Include overview, integration detail, review/conflict, and history views
- Make the review screen the strongest and most distinctive surface
- Use layout and hierarchy to communicate trust and operational seriousness
```

---

## Refinement Prompt: Make It More Operational

Use this if the first result is too decorative or too generic.

```text
Refine this design to feel more like a mission-critical operations console.

Improve:
- status visibility
- prioritization of risky items
- readability of field-level comparison
- distinction between safe updates and conflicts
- audit/history clarity

Reduce:
- decorative chrome
- oversized empty cards
- unnecessary visual effects
- ambiguous labels

Make the screen feel trustworthy under error, not just attractive under success.
```

---

## Refinement Prompt: Strengthen Conflict Review

Use this if the review page still looks like a generic checklist.

```text
Refine the review and conflict resolution screen.

Requirements:
- separate safe changes from conflicts
- add a left-side grouping rail by entity type or risk bucket
- make the focused comparison pane larger and more structured
- show local vs external values with clear provenance
- provide explicit resolution controls for each field
- add a sticky footer with unresolved count and final apply action

The user should feel like they are resolving a controlled sync batch, not checking random rows in a table.
```

---

## Refinement Prompt: Increase Auditability

Use this if the history screen is too simple.

```text
Refine the history view to feel like an audit surface instead of a plain activity table.

Add:
- event result states
- actor or trigger type
- changed field counts
- expandable before/after context
- stronger version hierarchy
- filtering controls for date, actor, and result

Keep it dense, readable, and serious.
```

---

## Short Prompt Variant

Use this when you want a compact version.

```text
Design a dark, high-trust B2B sync console for Portier.

The product manages bidirectional integration sync across tools like Salesforce and HubSpot. The core workflow is reviewing incoming changes, resolving ambiguous conflicts at field level, and approving a sync batch with clear audit history.

Required views:
- integrations overview with status, pending review count, version, and health
- integration detail with Sync Now, metrics, and incoming changes preview
- conflict review with local vs external values, per-field resolution, and sticky apply footer
- history/audit timeline with version, actor, result, and changed fields

Make it feel operational, dense, trustworthy, and implementation-friendly.
Avoid generic SaaS dashboard styling.
```