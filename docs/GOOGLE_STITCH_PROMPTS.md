# Google Stitch Prompt (Product Direction Only)

Use this when prompting Stitch. It defines what the product must do and how users should experience it, without dictating layout or visual style.

## Primary Prompt

```text
Design a high-fidelity web app called "Portier Integration Sync Panel".

Do not optimize for flashy visuals. Optimize for UX clarity, trust, and decision-making in a sync workflow.

Product purpose:
- Manage sync across multiple integrations (Salesforce, HubSpot, Stripe, Slack, Zendesk, Intercom)
- Let users run sync, review incoming changes, resolve conflicts safely, and inspect history

Core problem to solve:
- The same field can be changed in both systems at the same time
- The app must not silently choose a winner when conflict is ambiguous
- Users must be able to review, resolve, and confirm intentionally

Concrete conflict example:
- Portier user email: john@company.com
- HubSpot user email: j.smith@newdomain.com
- User must choose which value to keep

Data model context:
- User fields: name, email, phone, role, status
- Door fields: name, location, device_id, status, battery_level, last_seen
- Key fields: key_type, access_start, access_end, status

Required product areas from the brief:
1) Integrations list
2) Integration sync detail
3) Sync history and versioning
4) Conflict resolution

Required UX behaviors:
- Sync Now is the main trigger
- Show preview of changes before apply
- Show field-level conflicts with side-by-side values
- Allow per-field conflict decisions
- Make merge/apply action explicit and clear
- Make unresolved conflicts obvious
- Keep users oriented about what changed, what is pending, and what is final

Required system states to design clearly:
- loading
- syncing in progress
- no changes found
- conflicts present
- unresolved conflicts
- success
- failure with actionable retry

Error handling states to include:
- 4xx (configuration/request issues)
- 500 (internal error)
- 502 (integration provider unavailable)

API constraints:
- Endpoint: https://portier-takehometest.onrender.com/api/v1/data/sync
- Sync Now calls this API
- Data for preview/conflict/confirmation comes from this API response
- Other data can be mocked

Output expectation:
- Provide one cohesive, implementation-friendly UI direction
- Keep flow simple and practical
- Prioritize usability and functional clarity over decorative complexity
- Ensure the design supports safe, transparent, reviewable, auditable sync operations
```

## Refinement Prompt (Optional)

Use this after Stitch generates the first result.

```text
Refine this design to be simpler and more functional.

Reduce visual noise and wasted space.
Improve navigation clarity and decision flow for sync and conflict resolution.
Keep all required functionality, but remove unnecessary complexity.

Focus on:
- better readability of change review
- clearer conflict decision points
- clearer status and error communication
- faster path from Sync Now to confident apply
```
