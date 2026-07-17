# Dad AI

**A multi-tenant AI Business Operating System.** One codebase that delivers "custom SaaS" to each client as a configured tenant — CRM + AI Receptionist + AI Employee + Document AI + Knowledge Base (RAG) + Workflow Automation + Industry Connectors — driven by industry pack templates, not custom code.

The agency itself runs as **tenant #0** on the platform, using the same universal CRM to manage its own clients (dogfooding from day one).

## Documentation

| Doc                                              | Purpose                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)     | Full system architecture: multi-tenancy, DB schema, AI layer, workflows, connectors, security, infra |
| [docs/roadmap.md](docs/roadmap.md)               | Phased build roadmap with acceptance criteria                                                        |
| [docs/agency-crm.md](docs/agency-crm.md)         | How the agency runs as tenant #0 to manage its own clients                                           |
| [docs/industry-packs.md](docs/industry-packs.md) | The template system that makes each client's SaaS "custom"                                           |
| [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md)     | Human-only setup steps (Supabase, keys, deploys) to take the code live                               |

## Repository layout

```
dad-ai/
├── apps/
│   ├── customer/     # Next.js 15 — tenant-facing app
│   ├── admin/        # Next.js 15 — internal admin panel
│   ├── api/          # NestJS — main API
│   └── worker/       # NestJS standalone — BullMQ consumers
├── packages/
│   ├── ai/           # LLM router, prompt registry, agent runtime
│   ├── crm/          # CRM domain logic
│   ├── rag/          # Chunking, embedding, retrieval
│   ├── workflow/     # Platform events + n8n bridge
│   ├── connectors/   # Connector interface + implementations
│   ├── billing/      # Plans, feature gating, metering
│   ├── auth/         # RBAC, tenant claims
│   ├── analytics/    # Event tracking
│   ├── shared/       # Types, DTOs, zod schemas
│   └── ui/           # Shared component library
├── prisma/           # Single schema, migrations
└── templates/        # Industry pack definitions (agency, real-estate, …)
```

## Tech stack

| Layer                          | Choice                                                      |
| ------------------------------ | ----------------------------------------------------------- |
| Monorepo                       | Turborepo + pnpm workspaces                                 |
| Frontend                       | Next.js 15, TypeScript, Tailwind, shadcn/ui, TanStack Query |
| API                            | NestJS (REST `/v1`, OpenAPI)                                |
| DB / Auth / Storage / Realtime | Supabase (Postgres + pgvector, RLS)                         |
| ORM                            | Prisma                                                      |
| Queue / Cache                  | Upstash Redis + BullMQ                                      |
| LLMs                           | OpenRouter (routing policy in `packages/ai`)                |
| Workflows                      | n8n (Phase 1) → Temporal for critical flows (Phase 2)       |
| Billing                        | Razorpay Subscriptions (Stripe later)                       |

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in Supabase / Redis / OpenRouter keys
pnpm typecheck              # typecheck all workspaces
pnpm build                  # build all workspaces
npx prisma validate         # validate the schema
```

Apps:

```bash
pnpm --filter @dad-ai/customer dev   # tenant-facing app  → http://localhost:3000
pnpm --filter @dad-ai/admin dev      # admin panel        → http://localhost:3001
pnpm --filter @dad-ai/api dev        # API                → http://localhost:4000
pnpm --filter @dad-ai/worker dev     # queue worker
```
