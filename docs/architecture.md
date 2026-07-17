# Dad AI — System Architecture

**Version 1.1** — adapted from the v1.0 developer handoff document, with the agency-as-tenant-#0 decision baked in.

---

## 1. Product Definition

Dad AI is a **multi-tenant AI Business Operating System**. One codebase, one platform. Each client receives what feels like a custom SaaS, delivered as a configuration layer (an _industry pack_ plus tenant settings), not a separate app.

**Initial verticals:** Real Estate · Recruitment · Clinics · CA Firms · Legal Firms — plus the **Agency** pack used internally (see [agency-crm.md](agency-crm.md)).

**Core promise per tenant:** CRM + AI Receptionist + AI Employee + Document AI + Knowledge Base (RAG) + Workflow Automation + Industry Connectors.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   Customer Web App │ Admin Panel │ WhatsApp │ Phone │ Email │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTPS / WSS                  │ Webhooks
┌──────────────▼──────────────────────────────▼───────────────┐
│                    API GATEWAY (NestJS)                     │
│   Auth Guard │ Tenant Resolver │ Rate Limiter │ RBAC        │
└──────┬───────────┬───────────┬───────────┬─────────────────┘
       │           │           │           │
┌──────▼────┐ ┌────▼─────┐ ┌───▼──────┐ ┌──▼───────────┐
│ CRM       │ │ Document │ │ AI Agent │ │ Workflow     │
│ Service   │ │ AI       │ │ Service  │ │ Engine (n8n) │
└──────┬────┘ └────┬─────┘ └───┬──────┘ └──┬───────────┘
       │           │           │           │
┌──────▼───────────▼───────────▼───────────▼───────────┐
│              SHARED INFRASTRUCTURE                    │
│  Supabase Postgres (+ pgvector) │ Supabase Storage    │
│  Upstash Redis (Queue/Cache)    │ OpenRouter (LLMs)   │
└───────────────────────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────────────────┐
│              CONNECTOR LAYER (unified interface)      │
│  Google │ Microsoft │ WhatsApp │ LinkedIn │ Razorpay  │
│  99acres │ Naukri │ DocuSign │ DigiLocker │ Twilio    │
└───────────────────────────────────────────────────────┘
```

---

## 3. Multi-Tenancy Model

**Strategy: shared database, shared schema, row-level isolation via `tenant_id`.**

Non-negotiable rules:

1. Every business table has a `tenant_id UUID NOT NULL` column, indexed.
2. **Postgres Row Level Security (RLS)** is enabled on every tenant table. Policy: `tenant_id = auth.jwt() ->> 'tenant_id'`.
3. The API additionally enforces tenant scoping in a NestJS **TenantInterceptor** — never trust the client, never trust a single layer.
4. Tenant is resolved from the JWT claim (set at login) or subdomain (`{tenant}.dadai.app`).
5. All Prisma queries go through a **tenant-scoped Prisma client wrapper** that auto-injects `where: { tenantId }`. Direct raw queries require code review.

---

## 4. Database Schema

The full Prisma schema lives at [`prisma/schema.prisma`](../prisma/schema.prisma). Core entity groups:

- **Platform:** `Tenant`, `User`, `Subscription`
- **Universal CRM:** `Contact`, `Pipeline`, `Stage`, `Deal`, `Activity` (unified timeline), `Task`
- **Documents:** `Document`, `DocumentChunk` (pgvector embeddings)
- **AI:** `Agent`, `Conversation`, `Message`, `AiUsage` (billing metering)
- **Automation:** `ConnectorInstall`, `Workflow`, `WorkflowRun`

**Industry packs do NOT get their own tables initially.** Vertical-specific fields live in `customFields Json`, validated against a zod schema defined per pack in `templates/`. Promote to real columns only when query performance demands it.

---

## 5. Industry Pack System

See [industry-packs.md](industry-packs.md). The one-sentence version: **verticals (and clients) are data, not code** — each pack is a bundle of entity schemas, pipelines, prompts, workflows, connector recommendations, and UI terminology, applied to a tenant at provisioning time.

---

## 6. AI Layer

### 6.1 Model Router (`packages/ai`)

All LLM calls go through one internal service. Nothing calls OpenRouter directly.

```
Request → PromptRegistry → ModelRouter → OpenRouter → Response
              │                 │
        versioned prompts   routing policy:
                            - default: cheap fast model (gemini-flash class)
                            - reasoning/agents: claude-sonnet class
                            - fallback on error: gpt class
              │
        UsageMeter → AiUsage table (per tenant, per feature)
```

Responsibilities:

- **Prompt registry:** every prompt versioned in code, referenced by key (`receptionist.realestate.v3`). No inline prompts scattered in the codebase.
- **Metering:** log tokens + cost per call, tagged `tenantId` + `feature`. Feeds billing and the admin AI-cost dashboard.
- **Guardrails:** per-tenant monthly token budget → soft warn at 80%, hard cap at plan limit.
- **Caching:** Redis cache for deterministic calls (summaries of unchanged docs, etc.).

### 6.2 Agent Runtime

Agents are a loop: `LLM → tool call → execute → feed result back → repeat`.

**Tool catalog (function-calling tools):**

- `crm.searchContacts`, `crm.createLead`, `crm.updateDeal`, `crm.addNote`, `crm.createTask`
- `calendar.findSlots`, `calendar.book`
- `docs.search` (RAG), `docs.summarize`
- `comms.sendWhatsApp`, `comms.sendEmail`, `comms.sendSms`
- `workflow.trigger`
- `handoff.toHuman`

Every tool executes **tenant-scoped** and writes an `Activity` record (`actorType: "ai_agent"`) so every AI action appears on the CRM timeline — full auditability.

### 6.3 AI Receptionist (channel handling)

```
Inbound:
  WhatsApp Cloud API ─┐
  Twilio Voice (STT) ─┼→ Channel Webhook → Queue → Agent Runtime → Reply via channel
  Email (Resend in) ──┘         │
                          Contact matching:
                          phone/email → existing Contact or auto-create Lead
```

- Voice (Twilio → streaming STT → agent → TTS) is Phase 2; launch with WhatsApp + email + webchat first.
- Human handoff: agent tool `handoff.toHuman` sets the conversation to `NEEDS_HUMAN` and notifies the assigned user.

### 6.4 Document AI Pipeline

```
Upload → Supabase Storage → enqueue "doc.process"
  Worker:
    1. Detect type (pdf/image/docx)
    2. Extract text (pdf-parse; OCR via vision model for scans)
    3. Structured extraction (LLM w/ pack-specific schema:
       resume fields, prescription fields, GST invoice fields…)
    4. Summarize
    5. Chunk (~800 tokens, 100 overlap) → embed → DocumentChunk (pgvector)
    6. Mark READY, emit event "document.ready"
```

### 6.5 RAG (`packages/rag`)

- Embeddings: `text-embedding-3-small` (1536-d) via OpenRouter/OpenAI.
- Retrieval: pgvector cosine similarity, `WHERE tenant_id = $1`, top-k 8, optional metadata filters (doc type, date).
- Hybrid search (later): combine with Postgres full-text search, reciprocal rank fusion.
- Knowledge Base = same pipeline applied to SOPs/FAQs/policies the tenant uploads or types in.

---

## 7. Workflow Engine

**Phase 1: self-hosted n8n** (single instance, Railway/Fly.io ~$10/mo).

- Each tenant's workflows are n8n workflows **namespaced by tenant** (tag = tenantId). The `packages/workflow` bridge manages create/activate/deactivate via the n8n API.
- The API exposes generic trigger endpoints: `POST /v1/hooks/:workflowId` → validates tenant → forwards to n8n webhook.
- n8n calls back into the Dad AI API using a scoped **service token** per tenant (never master credentials).
- Standard platform events (workflows can subscribe): `lead.created`, `deal.stage_changed`, `document.ready`, `payment.received`, `appointment.booked`, `conversation.needs_human`.

**Phase 2 (scale trigger: >50 tenants or reliability issues):** migrate long-running/critical flows to **Temporal**; keep n8n for tenant-built automations.

---

## 8. Connector Architecture

One interface, many implementations (`packages/connectors`):

```typescript
interface Connector {
  provider: string;
  authenticate(tenantId: string, params: AuthParams): Promise<Credentials>;
  refreshAuth?(creds: Credentials): Promise<Credentials>;
  sync(tenantId: string, since?: Date): Promise<SyncResult>; // pull
  handleWebhook(payload: unknown, sig: string): Promise<Event[]>; // push
  search?(query: ConnectorQuery): Promise<Record[]>;
  create?(entity: string, data: unknown): Promise<Record>;
  update?(entity: string, id: string, data: unknown): Promise<Record>;
  remove?(entity: string, id: string): Promise<void>;
}
```

Rules:

- OAuth flows terminate at `api/connectors/:provider/callback`; tokens encrypted (see §11) into `ConnectorInstall.credentials`.
- All syncs run in the **worker** via BullMQ (`connector.sync` queue) with per-provider rate limiting and exponential backoff.
- Webhook ingress: `POST /v1/webhooks/:provider` → signature verification → normalize to internal events → queue.
- Lead-source connectors (99acres, MagicBricks, Housing, Naukri, LinkedIn, Indeed) normalize into `Contact` + `Deal` + `Activity(source: provider)`.

**Build order:** WhatsApp Cloud API → Google (Calendar/Gmail/Drive) → Razorpay → Resend/Twilio → then vertical-specific ones per pack launch.

---

## 9. API Design (NestJS)

- REST, versioned: `/v1/...`. OpenAPI spec auto-generated (`@nestjs/swagger`).
- Module per domain: `auth`, `tenants`, `crm`, `documents`, `agents`, `conversations`, `workflows`, `connectors`, `billing`, `admin`.
- **Request pipeline:** `AuthGuard (Supabase JWT) → TenantResolver → RBAC Guard → RateLimiter (Redis, per tenant + per user) → Controller`.
- Validation: zod schemas shared from `packages/shared` (same schemas validate on the frontend).
- Realtime: Supabase Realtime for CRM/board updates; SSE from the API for streaming agent responses.
- Idempotency keys required on all write endpoints hit by webhooks/workflows.

---

## 10. Frontend Apps

**Customer app (`apps/customer`)** — Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, React Hook Form + zod.

- Pack-driven UI: terminology, nav, dashboard widgets, and custom fields all render from the tenant's `ui.json` / field schemas fetched at session start.
- Core screens: Dashboard · CRM (list + kanban + contact timeline) · Inbox (all channels unified) · Documents · Knowledge Base · Workflows · Agents config · Settings/Billing.

**Admin app (`apps/admin`)** — internal only, separate deployment, IP-allowlist or admin SSO.

- Screens: Tenant management · Subscriptions & billing · AI cost per tenant/model/feature · Prompt log viewer · Agent monitoring (error rates, handoff rates) · Feature flags · Support tickets · System health.

---

## 11. Security & Compliance (non-negotiable)

1. **RLS on every tenant table** + API-layer tenant scoping (defense in depth).
2. **Secrets/credentials encryption:** connector tokens encrypted with AES-256-GCM using a key from environment (later: KMS). Never store plaintext tokens.
3. **RBAC:** OWNER / ADMIN / MEMBER roles enforced in guards; agents get scoped service tokens.
4. **Audit log:** all writes produce `Activity`/audit entries with an actor.
5. **PII & vertical sensitivity:** clinics = health data, CA/legal = financial/legal docs. Encrypt storage buckets, signed URLs with short TTL (60s), no public buckets. Data residency: keep the Supabase project in the region customers require (India → `ap-south-1` or nearest).
6. **Prompt injection defense:** document/RAG content is always passed as data with strict system prompts; agent tools have allowlists per agent; destructive tools (delete, payment) require human confirmation.
7. Webhook signature verification on every provider. Rate limiting everywhere. Dependency scanning in CI.

---

## 12. Infrastructure & Deployment

| Component                | Service                                     | Notes                    |
| ------------------------ | ------------------------------------------- | ------------------------ |
| customer + admin         | Vercel                                      | free → Pro $20           |
| api + worker             | Railway or Fly.io                           | 2 services, ~$10–20      |
| n8n                      | Railway/Fly                                 | ~$10                     |
| DB/Auth/Storage/Realtime | Supabase Pro                                | $25                      |
| Queue/Cache              | Upstash Redis                               | $10                      |
| LLMs                     | OpenRouter                                  | usage-based $50–200      |
| Email                    | Resend                                      | $20                      |
| SMS/Voice                | Twilio                                      | usage-based              |
| WhatsApp                 | Meta Cloud API                              | per-conversation pricing |
| Monitoring               | Sentry (free tier) + Axiom/Betterstack logs | ~$15                     |

**CI/CD:** GitHub Actions — lint, typecheck, test, Prisma validation → Vercel auto-deploy (apps), Railway deploy (api/worker). Environments: `dev` (local, Supabase local), `staging`, `prod` — three Supabase projects.

**Queues (BullMQ on Upstash):** `doc.process`, `connector.sync`, `agent.run`, `notify.send`, `workflow.trigger`, `billing.meter`. Dead-letter queue + Sentry alert on repeated failure.

---

## 13. Billing & Metering

- Plans: Trial (14d) → Starter → Pro → Business, per tenant. Razorpay Subscriptions first; Stripe when going international.
- Metered add-on: AI usage. `AiUsage` aggregated nightly → overage billed or hard-capped by plan.
- Feature gating via a `plan → features` map in `packages/billing`, checked in a `@RequiresFeature()` guard + mirrored in the frontend.
- Webhooks from Razorpay (payment success/failure) → update `Subscription`, emit `payment.received`.

---

## 14. What Success Looks Like Technically

- Adding vertical #6 requires **zero new backend services** — only a `templates/` bundle and connectors.
- Every AI action is visible on a CRM timeline and attributable to an agent.
- Per-tenant AI cost is known to the cent, in real time, in the admin panel.
- A tenant can be provisioned, packed, and live in under 5 minutes.
