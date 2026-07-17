# Dad AI — Build Roadmap

Phased developer sequence with acceptance criteria. Each phase gates the next.

---

## Phase 0 — Foundation (weeks 1–2)

**Goal:** a deployable skeleton with auth, tenancy, and CI.

- Monorepo (Turborepo + pnpm) — _scaffolded in this repo_
- GitHub Actions CI: install → lint → typecheck → build → `prisma validate`
- Supabase project (dev): Postgres + pgvector, Auth, Storage
- Prisma schema migrated; **RLS policies on every tenant table**
- Auth: Supabase (Google/Microsoft/email/magic-link), JWT carries `tenant_id` claim
- Tenant provisioning endpoint: create tenant → apply industry pack → invite owner
- RBAC guards (OWNER / ADMIN / MEMBER / AGENT)
- Base UI shell in `apps/customer` (nav, layout, auth pages)

**Done when:** a new tenant can sign up, log in, and see an empty pack-labeled dashboard; CI is green.

---

## Phase 1 — Core Platform (weeks 3–6)

**Goal:** a usable CRM with documents and AI chat — and the agency living on it.

- Universal CRM: contacts, pipelines (kanban), deals, tasks, unified Activity timeline
- Document upload → processing pipeline (extract, summarize, chunk, embed)
- AI chat with RAG over tenant documents / knowledge base
- Model router + prompt registry + per-tenant usage metering (`AiUsage`)
- Admin panel v1: tenant list, usage, AI costs
- **Dogfood milestone: provision tenant #0 with the `agency` pack and move all client tracking into Dad AI** (see [agency-crm.md](agency-crm.md))

**Done when:** the agency manages its real client pipeline in Dad AI daily; AI chat answers questions from uploaded docs; admin panel shows per-tenant AI cost.

---

## Phase 2 — AI Modules (weeks 7–10)

**Goal:** the AI actually works for tenants across channels.

- Agent runtime + tool catalog (all tools tenant-scoped, all actions on the timeline)
- AI Receptionist on WhatsApp Cloud API + webchat + email (voice deferred)
- AI Employee: scheduled follow-ups, CRM updates, daily reports
- n8n integration + platform events (`lead.created`, `deal.stage_changed`, `document.ready`, `payment.received`, `appointment.booked`, `conversation.needs_human`)
- Notifications: Resend / Twilio / WhatsApp / push
- Human handoff flow (`NEEDS_HUMAN` + assignment + notification)

**Done when:** a WhatsApp message to a tenant's number creates/updates a lead, gets an AI reply, and appears in the unified inbox with full timeline attribution.

---

## Phase 3 — First Industry Pack + Revenue (weeks 11–13)

**Goal:** one vertical live with paying design partners.

- Pick **one** vertical: Real Estate or Recruitment (clearest ROI, least regulatory burden)
- Build its full template bundle in `templates/`
- 2–3 key connectors for that vertical (e.g. 99acres + Google Calendar + Razorpay)
- Billing live: Razorpay Subscriptions, plan gating, trial flow
- Onboard 3–5 design partners at founder pricing

**Done when:** a design partner can be provisioned, packed, and live in under 5 minutes — and at least one is paying.

---

## Phase 4 — Scale Packs (ongoing)

- Add remaining verticals **one at a time** (~2–3 weeks each: mostly template + connectors)
- Voice receptionist (Twilio streaming STT/TTS)
- Temporal for critical/long-running workflows (trigger: >50 tenants or reliability issues)
- Marketplace (templates / connectors / agents) — only after 50+ paying tenants
- Stripe for international billing

**Hard rule:** do not start a second vertical until the first has paying customers. The architecture supports five verticals; the go-to-market should not attempt five at once.
