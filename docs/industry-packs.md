# Industry Pack System

This is the key design decision that makes Dad AI able to deliver "custom SaaS" to every client from one codebase: **verticals — and individual clients — are data, not code.**

Each vertical is a **template bundle** in `templates/{pack}/`:

```
templates/real-estate/
├── pack.json          # metadata, plan gating
├── entities.json      # contact types, custom field schemas
├── pipelines.json     # default pipelines & stages
├── prompts/           # agent system prompts tuned for the vertical
├── workflows/         # default n8n workflow exports
├── connectors.json    # recommended connectors (99acres, MagicBricks…)
└── ui.json            # nav labels, dashboard widgets, terminology map
                       #   ("Contact" → "Patient" for clinics, etc.)
```

## File formats

- **`pack.json`** — `{ id, name, version, description, minPlan }`
- **`entities.json`** — contact types for the vertical and, per entity, the custom-field schema (field key, label, type, required, options). These are compiled to zod validators in `packages/shared` so the same schema validates on API and frontend.
- **`pipelines.json`** — default pipelines with ordered stages, e.g. Real Estate: `Lead → Site Visit → Booking → Agreement → Payment`.
- **`prompts/`** — versioned agent system prompts registered into the prompt registry under keys like `receptionist.realestate.v1`.
- **`workflows/`** — n8n workflow exports installed (tenant-tagged) at provisioning.
- **`connectors.json`** — connectors surfaced in the tenant's "Integrations" screen for one-click install.
- **`ui.json`** — terminology map, nav configuration, and dashboard widget list. The frontend is generic and renders entirely from this file — that's why one codebase serves every vertical.

## Provisioning flow

On tenant signup (or admin-panel provisioning), an **`ApplyIndustryPack` job** runs in the worker:

1. Read the pack bundle for the tenant's `industryPack`.
2. Seed pipelines + stages from `pipelines.json`.
3. Register custom-field schemas from `entities.json` into tenant settings.
4. Create default agents wired to the pack's prompts.
5. Install default workflows (n8n, tagged with the tenantId).
6. Store `ui.json` in tenant settings for the frontend to fetch at session start.

Target: **tenant provisioned, packed, and live in under 5 minutes.**

## Per-client customization ("custom SaaS")

A pack is the starting point, not a cage. After provisioning, everything the pack seeded is tenant-owned data and can be customized per client:

- rename/add pipeline stages
- add custom fields (validated, stored in `customFields Json`)
- edit agent prompts and enabled tools
- add/modify workflows
- override terminology and branding in tenant settings

This is how each client gets a SaaS that fits their business without a single line of client-specific code.

## Current packs

| Pack                           | Status         | Notes                                                                    |
| ------------------------------ | -------------- | ------------------------------------------------------------------------ |
| `agency`                       | seeded in repo | Tenant #0 — the agency's own client CRM ([agency-crm.md](agency-crm.md)) |
| `real-estate`                  | seeded in repo | Candidate first vertical (Phase 3)                                       |
| recruitment, clinic, ca, legal | planned        | One at a time, per the roadmap hard rule                                 |

## Rules

- **No pack-specific tables** initially. Vertical fields live in `customFields Json`; promote to real columns only when query performance demands it.
- **No pack-specific backend code.** If a vertical seems to need custom endpoints, first ask whether it's really a missing generic capability.
- Adding vertical #6 must require **zero new backend services** — only a `templates/` bundle and connectors.
