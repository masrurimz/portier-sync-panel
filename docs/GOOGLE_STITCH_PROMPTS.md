# Google Stitch Prompts for Integration Sync Panel

## Intent

This prompt set is meant to steer Google Stitch with strong product, UX, and workflow direction while leaving visual exploration open.

The goal is not to hand-design the interface in the prompt.
The goal is to give Stitch enough product context, decision structure, and UX constraints so it can produce high-fidelity work that is distinctive, thoughtful, and aligned with the take-home.

---

## Best-Practice Framing for Stitch

Use Stitch like this:

1. Start with one strong product brief.
2. Ask for multiple high-fidelity directions, not one fixed visual system.
3. Choose the strongest direction.
4. Refine one screen or one concern at a time.
5. Improve the core workflow first, then raise polish.

What to avoid:
- giant prompts that specify every visual detail
- generic phrases like "modern SaaS dashboard"
- mixing layout changes, feature additions, and style changes in one follow-up
- forcing Stitch into bland enterprise defaults

What to emphasize:
- information hierarchy
- decision support
- risky-action UX
- state handling
- clarity during review and conflict resolution
- auditability and trust

---

## Primary Stitch Prompt

Paste this into Google Stitch:

```text
You are designing a high-fidelity Portier Sync Panel for a frontend take-home test.

This is not a marketing site and not a generic SaaS dashboard. It is a safety-critical product workflow for reviewing and applying sync changes from external systems into an internal source of truth.

Your job is to explore ambitious, high-quality product UI directions while keeping the workflow safe, transparent, reviewable, and auditable.

Primary product goal:
- Help operators sync data from third-party integrations into Portier with confidence.
- The user must always understand what will change, why it changed, what is risky, what needs review, and what happened after apply.

Target users:
- Enterprise IT admins
- Operations managers
- Internal staff responsible for reviewing and approving data changes

Core problem:
- Data can change in both Portier and an external integration at the same time.
- The system must not silently overwrite ambiguous values.
- Users need to preview incoming changes, resolve field-level conflicts, confirm intentionally, and inspect history later.

Concrete example of the problem:
- A user's email might be updated locally in Portier to john@company.com while HubSpot updates the same user's email to j.smith@newdomain.com.
- The system cannot safely assume which value is correct.
- The interface should make this kind of ambiguity obvious, explainable, and resolvable.

Core entities involved:
- User
- Door
- Key

Likely fields that can appear in preview or conflict resolution:
- User: name, email, phone, role, status
- Door: name, location, device_id, status, battery_level, last_seen
- Key: key_type, access_start, access_end, status

The design should make room for different kinds of field changes:
- simple scalar changes like email, role, or status
- operational changes like battery_level or last_seen
- access-control changes like key_type or access_end
- potentially destructive or sensitive changes that should feel higher risk than ordinary updates

Integrations to include:
- Salesforce
- HubSpot
- Stripe
- Slack
- Zendesk
- Intercom

Design the full workflow:

1. Integrations List
- Show all integrations with status, connection health, attention needed, last sync time, and version.
- Include search/filtering.
- Support loading, empty, and error states.

2. Integration Detail
- Show overview, current sync health, last run summary, and configuration context.
- Include Sync Now as the primary action.
- Make it easy to reach preview and history.

3. Sync Preview
- This is the most important part of the product.
- Show what will change before anything is applied.
- Group changes into Added, Updated, Deleted, and Conflicts.
- Show counts, scope, and risk clearly.
- Let users inspect individual records and fields.
- Make the experience feel like a review checkpoint, not a background operation.
- Show examples of realistic changes across User, Door, and Key records so the product does not feel abstract.

4. Conflict Resolution
- Show side-by-side comparison of Portier value vs integration value.
- Show provenance or explanation for why something is a conflict.
- Let users choose a resolution per field.
- Support bulk decisions when safe, but preserve granular control.
- Make unresolved conflicts impossible to miss.
- Block final confirmation if required decisions are missing.
- Ensure the conflict UI works for fields like user.email, user.role, door.status, door.location, key.status, and key.access_end.

5. Confirm and Apply
- Show a deliberate confirmation step.
- Summarize exactly what will happen.
- Make risky consequences legible.
- Reinforce user confidence before apply.

6. Result State
- Show success, partial success, and failure outcomes.
- If partial, explain what succeeded, what failed, and what the user should do next.
- Include retry or follow-up actions.

7. History and Audit
- Show a timeline or list of past sync runs.
- Include timestamp, source, integration, version, outcome, counts, and drill-down details.
- Let users inspect what changed and how conflicts were resolved.
- Make the history feel referenceable and trustworthy.

Important states to design explicitly:
- initial loading
- empty state
- no changes detected
- preview loading
- conflicts present
- unresolved conflicts
- apply in progress
- success
- partial success
- failure with retry
- stale preview that requires refresh
- disconnected or expired integration state

Error-handling requirements:
- 4xx should read as configuration/request issues
- 500 should read as internal server problems
- 502 should read as integration provider unavailable or down
- errors should be understandable and actionable
- include retry, technical details, and clear recovery paths where appropriate

API and data constraints:
- Only Sync Now must call the real API endpoint
- Endpoint: https://portier-takehometest.onrender.com/api/v1/data/sync
- Request requires application_id
- Data used for preview, conflict resolution, and sync confirmation should come from this API interaction
- Other data like integration catalog, history, and historical versions can be mocked or locally modeled

Assumptions you may make:
- The sync preview can include a run id, timestamp, change summary, and a list of field-level changes
- Conflict items can include enough detail to compare local vs external values
- Apply can be represented as a client-side confirmation step if no backend apply endpoint exists
- History can be mocked if it remains consistent with the workflow

Non-negotiable UX principles:
- review before apply
- explicit decision support
- auditability and traceability
- confidence during risky actions
- high clarity in states and outcomes

Visual exploration requirements:
- Create 3 distinct high-fidelity design directions for the same product flow
- Each direction should have a different layout approach and information hierarchy, not just different colors
- Do not default to a cookie-cutter enterprise dashboard
- Do not use generic left-sidebar-plus-card-grid patterns unless there is a very strong reason
- Make the UI feel intentional, premium, and product-real
- Use the visual system to support trust, review, and decision-making

Output requirements:
- Produce the full set of screens for each direction: Integrations List, Integration Detail, Sync Preview, Conflict Resolution, Confirm and Apply, Result, History
- For each direction, briefly explain what makes its UX approach distinct
- Keep the design high-fidelity and presentation-ready
- Optimize for thoughtful product design, not just pretty screens
```

---

## Follow-Up Prompt 1: Pick and Strengthen One Direction

Use after Stitch gives you multiple directions:

```text
Take the strongest direction and refine it further.

Do not redesign the whole product from scratch.
Keep the core structure, but improve the quality of the Sync Preview and Conflict Resolution experience first.

Make the review flow feel more like a decision workbench:
- clearer hierarchy between summary, changes, and conflicts
- stronger distinction between safe changes and risky ones
- easier field-level comparison
- better visibility into what is unresolved
- stronger confidence before confirm

Make this feel like the heart of the product.
```

---

## Follow-Up Prompt 2: Improve States

```text
Now improve the important states across the chosen direction.

Make loading, empty, no-changes, stale-preview, partial-success, error, retry, disconnected integration, and apply-in-progress states feel fully designed rather than afterthoughts.

The user should always know:
- what is happening
- whether action is required
- whether it is safe to proceed
- how to recover if something fails
```

---

## Follow-Up Prompt 3: Raise the Design Quality Without Losing UX

```text
Now raise the visual quality of this direction.

Do not reduce clarity or turn it into a generic SaaS dashboard.
Push the interface toward a more distinctive, memorable, premium product design while preserving usability, scannability, and trust.

Increase the sense that this is a serious review-and-approval product, not just a settings page.
```

---

## Follow-Up Prompt 4: Strengthen Auditability

```text
Refine the design so auditability feels first-class.

History, result, and conflict decisions should feel referenceable later.
Make it easy to understand what changed, why it changed, who approved it, and what the outcome was.

The design should communicate traceability, not just completion.
```

---

## Submission Fit

This prompt strategy is designed to align with Portier's take-home criteria:
- thoughtful UX
- robust handling of states and errors
- clear separation of sync action, review flow, and history
- practical architecture implied by the screens
- strong design without letting aesthetics overpower the product problem
