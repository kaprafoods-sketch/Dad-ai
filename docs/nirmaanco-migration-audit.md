# Dad AI → Nirmaanco: Migration Audit

> **Phase 0 — completed 2026-10-17.** Method: read-only inspection via the GitHub connector (repo root, `apps/`, `packages/`, `prisma/`, `docs/`, `templates/`, CI, config files). **Not inspected:** live site, analytics, search index (not reachable through the connector); live Vercel/Render deployments; repo write access (untested — see §7.7). GitHub code search is unreliable for this repo (incomplete index), so the brand inventory is from direct file reads, sampled for deep packages — treat as high-confidence for the customer/admin frontends, sampled elsewhere. Recommend a local `grep -ri "dad.ai\|dadai"` pass before the final P1 diff.

**Repo:** `kaprafoods-sketch/Dad-ai` · **Branch inspected:** `claude/dad-ai-saas-plan-sagmfn`

## 1. Headline finding

The master prompt assumes an existing "Dad AI website" to convert. **That website does not exist in this repo.** `apps/customer` is a SaaS dashboard app (CRM UI) with a one-paragraph stub landing page (`/` → h1 + "Open dashboard" button). There are no services, about, contact, knowledge, case-study, or policy pages anywhere. The public website is therefore a **net-new build** — implemented as a separate Next.js app (`apps/site`), preserving the working platform underneath it. The brand-visible surface of the platform is tiny — almost everything "Dad AI" lives in metadata, one wordmark, docs, and config defaults.

## 2. Current stack and architecture

| Layer                          | Choice                                                                                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo                       | Turborepo 2.5 + pnpm 10.12.4 workspaces, `pnpm-workspace.yaml`: `apps/*`, `packages/*`; Node ≥20, TypeScript 5.8                                                                                                                  |
| Customer app (`apps/customer`) | Next.js 15.3 App Router, React 19, port 3000; deploys to **Vercel** (`vercel.json`, build via monorepo root)                                                                                                                      |
| Admin app (`apps/admin`)       | Next.js 15.3 App Router placeholder shell; deploys to **Vercel**                                                                                                                                                                  |
| API (`apps/api`)               | NestJS, REST `/v1` + OpenAPI, port 4000, Docker; deploys to **Render** (`dad-ai-api` service)                                                                                                                                     |
| Worker (`apps/worker`)         | NestJS standalone, BullMQ consumers (agent-run, document, notify, workflow-trigger); Docker; Render (`dad-ai-worker`)                                                                                                             |
| Styling                        | Tailwind CSS 4.1 (CSS-first: `globals.css` is just `@import 'tailwindcss'`); zinc palette, default system font; **no design tokens, no custom fonts**                                                                             |
| Component lib                  | `@dad-ai/ui` — hand-rolled, exports only `Button` (primary/secondary/ghost) + `cn`. **README claims shadcn/ui; it is NOT in the tree**                                                                                            |
| Data                           | TanStack Query 5 in customer app; `@dad-ai/db` Prisma client wrapper (tenant-scoped)                                                                                                                                              |
| DB/Auth/Storage/Realtime       | Supabase (Postgres + pgvector, RLS via `prisma/rls.sql`)                                                                                                                                                                          |
| ORM                            | Prisma 6.8, single shared schema, 18 models (Tenant, User, Contact, Pipeline, Stage, Deal, Activity, Task, Document, DocumentChunk, Agent, Conversation, Message, AiUsage, ConnectorInstall, Workflow, WorkflowRun, Subscription) |
| Queue/Cache                    | Upstash Redis + BullMQ                                                                                                                                                                                                            |
| LLMs                           | OpenRouter via `packages/ai` (PromptRegistry → ModelRouter; gemini-flash default, claude-sonnet reasoning, gpt fallback; per-tenant usage metering)                                                                               |
| Workflows                      | n8n bridge (`packages/workflow`); platform events: lead.created, deal.stage_changed, document.ready, payment.received, appointment.booked, conversation.needs_human                                                               |
| Billing                        | Razorpay Subscriptions (Stripe deferred)                                                                                                                                                                                          |
| Integrations                   | WhatsApp Cloud API, Resend, Twilio, Google OAuth (Calendar/Gmail/Drive), 99acres/Naukri/DocuSign/DigiLocker/LinkedIn connector stubs                                                                                              |
| Tests/QA                       | vitest (`packages/**/*.test.ts`, `apps/**/*.test.ts`; 2 test files seen in `packages/ai`); Prettier as lint (`pnpm lint` = `prettier --check`); `tsc --noEmit` per workspace                                                      |
| CI                             | `.github/workflows/ci.yml`: install → Prisma generate/validate → lint → typecheck → test → build                                                                                                                                  |

Tenancy: shared DB, shared schema, row-level isolation (`tenant_id` + Postgres RLS + NestJS TenantInterceptor + tenant-scoped Prisma wrapper). Tenant resolved from Supabase JWT custom claim `tenant_id` (plus optional `role_dadai`) — frontend dev path uses `x-tenant-id` via `NEXT_PUBLIC_DEV_TENANT_ID`.

## 3. Routes and what each does

### `apps/customer` (only customer-facing web surface)

| Route              | File                           | Purpose                                                                                                                                                      |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                | `app/page.tsx`                 | **Stub landing page.** h1 + one tagline paragraph + CTA "Open dashboard" → `/dashboard`. No marketing content.                                               |
| `/dashboard`       | `app/dashboard/page.tsx`       | CRM stats: contacts count, open deals, pipeline value (₹, en-IN). "API not reachable" hint when backend down.                                                |
| `/dashboard/crm`   | `app/dashboard/crm/page.tsx`   | Contacts table + "Add lead" form (name, optional email) → `POST /v1/crm/contacts`                                                                            |
| `/dashboard/board` | `app/dashboard/board/page.tsx` | Kanban: deals grouped by pipeline stage; move card via `POST /v1/crm/deals/:id/stage`                                                                        |
| `/dashboard/inbox` | `app/dashboard/inbox/page.tsx` | Webchat test UI for the tenant's AI Receptionist → `POST /v1/conversations/webchat` (contract: `{ message, conversationId? }` → `{ conversationId, reply }`) |

API client: `apps/customer/lib/api.ts` — `fetch(NEXT_PUBLIC_API_URL ?? localhost:4000)/v1${path}` with `x-tenant-id` dev header; **Supabase auth is not wired yet** (DEV_AUTH_BYPASS path only).

### `apps/admin` (internal)

| Route | Purpose                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`   | Placeholder: section cards (Tenants, Subscriptions, AI Costs, Agent Monitoring…). Internal only; deployed separately behind IP allowlist/admin SSO per docs. |

### API (`/v1` modules)

`admin · agents · auth · billing · connectors · conversations · crm · documents · tenants · webhooks · workflows` + `/v1/health` (Render health check). Core: auth guard, tenant context, RBAC guards, feature gating, zod validation pipe, BullMQ queue service.

### Worker processors

`agent-run` · `document` (extract/summarize/chunk/embed) · `notify` (email/SMS/WhatsApp) · `workflow-trigger`.

## 4. Features and integrations to preserve

1. **Universal CRM** — contacts, pipelines (kanban), deals, tasks, unified Activity timeline (deal stage moves auto-logged).
2. **Document AI pipeline** — upload → worker processing → chunking/embeddings (pgvector) → RAG search/summarize.
3. **AI Receptionist + Agent runtime** — prompt registry (`packages/ai`), versioned pack prompts, tool catalog (crm.\*, calendar.\*, docs.\*, comms.\*, workflow.trigger, handoff.toHuman), per-tenant token metering.
4. **Industry pack system** — `templates/{agency,real-estate,recruitment,clinic,ca,legal}/`; `ApplyIndustryPack` job; frontend nav/terminology from tenant `settings.pack.ui`. **The repo's crown jewel — do not touch.**
5. **Auth/RBAC** — Supabase JWT `tenant_id` claim, OWNER/ADMIN/MEMBER/AGENT roles, dev bypass (dev only).
6. **Notifications** — Resend/Twilio/WhatsApp via notify queue (no-throw on missing config).
7. **Billing** — Razorpay subscriptions + webhooks, plan gating, `AiUsage` metering.
8. **n8n bridge + platform events** for automation.
9. **Dogfood model** — agency runs as tenant #0 with the `agency` pack (CRM terminology remapped: Contact→Client, Deal→Opportunity; nav: Clients, Inbox, Contracts & Docs, Knowledge Base, Automations, AI Agents).

## 5. Current visual system and reusable components

- **No design system.** No tokens file, no custom fonts, no CSS variables beyond Tailwind defaults. Palette: white surfaces, zinc-900 text, zinc-100/200 borders, amber-600 warnings.
- Reusable: `packages/ui` exports `Button` (3 variants) + `cn`. Dashboard pages use inline Tailwind, not the Button component.
- Layout: dashboard sidebar shell (56px aside, brand wordmark top) — app shell, not marketing UI.
- **Zero brand assets:** no `public/` directory in either Next app, no favicon, no logo image (wordmark is plain text), no OG images, no illustrations. **No Byte character assets in the repo** (Byte assets were supplied externally for the new site).
- Typography per master prompt (Montserrat ExtraBold / Poppins Bold): nothing was loaded; the new site introduces Montserrat + Inter via `next/font`.

## 6. SEO, analytics, accessibility, performance observations

- **SEO: nothing existed.** No `robots.txt`, no `sitemap.xml`, no favicon, no Open Graph/Twitter meta, no canonical tags, no structured data, no meta descriptions beyond two `metadata` objects. All primitives built net-new in `apps/site`.
- **Analytics: nothing wired.** No GA/PostHog/Vercel Analytics in the customer frontend. `packages/analytics` is server-side event tracking — **not connected to the website**. No baseline traffic data available; do not invent baselines.
- **Accessibility (platform UI):** basic semantic HTML, keyboard-operable nav/buttons; gaps: placeholder-only form inputs (no `<label>`), no focus-visible styling beyond defaults, no skip link, no reduced-motion handling.
- **Performance:** platform frontend is trivially light — no images, no webfonts, no client JS beyond React Query. Dashboard pages are fully client-rendered (no SSR data); the marketing site does not copy that pattern for SEO pages.
- **Doc/code conflict (tenant routing):** `docs/architecture.md` §3 says tenants resolve via JWT claim **or subdomain `{tenant}.dadai.app`**; the customer app only implements the dev header — subdomain routing is not visible in code. `dadai.app` exists only in docs.

## 7. Technical debt and risks

1. **README/docs vs code gaps.** README claims shadcn/ui (absent); roadmap claims "auth pages" in the customer shell (absent); roadmap claims Phases 0–3 "typechecked, unit-tested, building green" while auth is unwired and admin is a placeholder. Treat docs as aspirational; code is the truth.
2. **Auth not wired.** Customer app only works with `DEV_AUTH_BYPASS` + `NEXT_PUBLIC_DEV_TENANT_ID`. No signup/login pages.
3. **Split deployment** (Vercel ×2 + Render ×2) with CORS/env coordination (`CORS_ORIGINS`, `CUSTOMER_APP_URL`, `NEXT_PUBLIC_API_URL`); `render.yaml` + `vercel.json` both need updates if domains change.
4. **Hardcoded brand in config defaults** — `RESEND_FROM=noreply@dad-ai.local`, seed tenant name, `AGENCY_SLUG` default.
5. **No tests visible for frontend** (vitest globs cover apps, but only `packages/ai` test files confirmed); no E2E.
6. **Supabase JWT custom claims** (`tenant_id`, `role_dadai`) are a manual dashboard step — the whole tenancy model rests on it.
7. **Transience of connector reads:** two fetches failed with HTTP 503 and succeeded on retry — flaky upstream, not repo issues.
8. **Write access unverified at audit time.** Reads work via the GitHub connector; the sibling repo `kaprafoods-sketch/guruprakash-cables` returned 403 "Resource not accessible by integration" on writes on 2026-10-17 — confirm `Dad-ai` is in the App's repository access before planning pushes.

## 8. Brand-occurrence inventory (audit-time)

### (a) Visible brand text / metadata / config — updated in P1 (see §10)

| #   | File                                       | Occurrence                                                                                                            |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| A1  | `apps/customer/app/layout.tsx`             | `title: 'Dad AI'`, description                                                                                        |
| A2  | `apps/customer/app/page.tsx`               | h1 `Dad AI` + tagline (only marketing copy in repo)                                                                   |
| A3  | `apps/customer/app/dashboard/layout.tsx`   | Sidebar wordmark `Dad AI`                                                                                             |
| A4  | `apps/admin/app/layout.tsx`                | `title: 'Dad AI — Admin'`                                                                                             |
| A5  | `README.md`                                | `# Dad AI` heading                                                                                                    |
| A6  | `docs/*.md`                                | "Dad AI" throughout (titles intentionally left as historical record)                                                  |
| A7  | `packages/notify/src/index.ts`             | Default `RESEND_FROM = 'noreply@dad-ai.local'`                                                                        |
| A8  | `.env.example`                             | `AGENCY_SLUG=dad-ai`, `AGENCY_OWNER_EMAIL=owner@dad-ai.local`, `RESEND_FROM`                                          |
| A9  | `prisma/seed.ts`                           | Tenant name `'Dad AI (Agency)'`, slug default `'dad-ai'`                                                              |
| A10 | `templates/agency/pack.json`               | description "the Dad AI agency's own client CRM"                                                                      |
| A11 | `templates/agency/prompts/receptionist.md` | Uses `{{tenantName}}` placeholder (brand-safe); generic agency description — no change needed                         |
| A12 | `prisma/schema.prisma`                     | Header comment `// Dad AI — single shared schema`                                                                     |
| A13 | `render.yaml`                              | Service names `dad-ai-api`, `dad-ai-worker`; comment "Dad AI backend" — infra naming, rename only with deploy updates |
| A14 | `docs/architecture.md`                     | `{tenant}.dadai.app` subdomain scheme — docs-only, no code implements it                                              |

### (b) Internal identifiers — NOT renamed (correct decision, verified post-build)

- **npm scope `@dad-ai/*`** — 14 packages + 4 apps. Purely internal; renaming = churn.
- **Repo name** `kaprafoods-sketch/Dad-ai` — affects remotes/CI; cosmetic.
- **`AGENCY_SLUG` default `'dad-ai'`** — database value for tenant #0; change via env + data migration, not find/replace.
- **`IndustryPack.AGENCY` enum** — data value referenced across API/worker.
- **JWT custom claim `role_dadai`** — auth contract between Supabase hook and API; renaming breaks login.
- **API route prefix `/v1`**, header names, queue names — no brand content.
- **`render.yaml` service names** — left alone; rename only with coordinated deploy changes.
- **`dadai.app`** — docs-only, no code dependency.

## 9. Unknowns (carried forward)

1. ~~Website vehicle~~ → **resolved:** new `apps/site` Next.js app; customer/admin untouched.
2. **Domain strategy:** planned `nirmaanco.in` — **unconfirmed.** Canonicals/sitemap/OG all derive from `NEXT_PUBLIC_SITE_URL` defaulting to `https://nirmaanco.in`; change one env var when decided.
3. **Repo visibility:** public (cloned successfully).
4. ~~Package scope rename~~ → **resolved:** keep `@dad-ai/*`.
5. **Tenant #0 slug:** keep `AGENCY_SLUG=dad-ai` (data-layer, invisible); seed name changed to `Nirmaanco (Agency)`.
6. **GitHub App write access** for `Dad-ai` — reads confirmed; writes untested at audit time; sibling repo 403'd on writes 2026-10-17.
7. **Live deployments:** Vercel/Render targets from `vercel.json`/`render.yaml` not inspected — no data; do not assume traffic.
8. **Analytics provider choice** (GA4 / PostHog / none yet) and Search Console ownership — unconfirmed.
9. **Byte asset delivery** — resolved: 3 webp assets (`byte-pfp`, `byte-pointing`, `byte-board`) placed in `apps/site/public/byte/`; `byte-pointing.webp` used in ByteFeature hero position (right-aligned, pointing upward) per v3 spec.
10. **Enquiry destination** — resolved: contact form → `POST /v1/crm/contacts` with `{ type: 'lead', name, email }`; honest missing-config state when `NEXT_PUBLIC_API_URL` unset. Extra form fields (business, website, service interest, message, budget) are collected for visitor context only and intentionally NOT sent (API zod schema rejects unknown keys — `customFields` enrichment is a later option).
11. **Content engine** — resolved: static TSX guides in repo, no CMS (simplest sustainable; see content model doc).
12. **Voice AI:** repo defers voice ("Phase 2", Twilio streaming planned). Tap-to-talk is a browser Web Speech API demo wired to `/v1/conversations/webchat` — **not telephony**; no latency claims are made. Do not claim phone-call capability on the site.

## 10. Post-audit build status (2026-10-17)

Phase 0 conclusions were implemented the same day. All changes are additive plus ten one-line brand edits (revertible).

### P1 brand updates applied (10 files, `git diff --stat`: 12 insertions, 11 deletions)

1. `.env.example` — `RESEND_FROM` → `noreply@nirmaanco.in` (comment: PLANNED domain, confirm before production use)
2. `README.md` — `# Dad AI` → `# Nirmaanco`
3. `apps/admin/app/layout.tsx` — title → `'Nirmaanco — Admin'`
4. `apps/customer/app/dashboard/layout.tsx` — sidebar wordmark → `Nirmaanco`
5. `apps/customer/app/layout.tsx` — title → `'Nirmaanco'`, description gains "Build Smarter. Grow Faster."
6. `apps/customer/app/page.tsx` — stub h1 → `Nirmaanco` (tagline unchanged; page remains a dashboard entry point)
7. `packages/notify/src/index.ts` — `RESEND_FROM` default → `'noreply@nirmaanco.in'` (planned-domain comment)
8. `prisma/schema.prisma` — header comment → `// Nirmaanco — single shared schema`
9. `prisma/seed.ts` — seed tenant name → `'Nirmaanco (Agency)'`
10. `templates/agency/pack.json` — description → "the Nirmaanco agency's own client CRM"

### `apps/site` scaffolded (untracked, `apps/site/`)

- **13 content routes + SEO routes:** `/`, `/services`, `/services/digital-presence`, `/services/digital-growth`, `/services/ai-automation`, `/knowledge`, `/knowledge/document-ai-pipeline`, `/knowledge/ai-receptionist-webchat`, `/work` (honest empty state), `/about`, `/contact`, `/privacy`, `/terms`; `robots.ts`, `sitemap.ts`, `favicon.svg` (Ember square, N glyph), `not-found.tsx` (noindex).
- **8 components:** `SiteHeader` (sticky, mobile menu, active-path state), `SiteFooter` (brand + nav + policies), `Hero` (props: eyebrow/title/highlight/subtitle/primaryCta/secondaryCta), `CTABand` (props: title/subtitle/ctaLabel), `ServiceDetail` (props: eyebrow/title/highlight/intro/who/problem/deliverables[]/engagement/scope/related[]), `ByteFeature` (4 editorial series + byte-pointing asset), `ContactForm` (client-validated, exact `{type:'lead',name,email}` POST, missing-config UI state), `TapToTalk` (states: idle/listening/sending/speaking; en-IN + hi-IN language selector; unsupported-browser, mic-denied, API-missing, API-error states).
- **Config:** `app/lib/site-config.ts` (SITE_URL from `NEXT_PUBLIC_SITE_URL` defaulting to `https://nirmaanco.in`; API_URL/DEV_TENANT_ID from env with no localhost fallback; NAV, SERVICES, SERVICE_INTEREST_OPTIONS, Organization + WebSite JSON-LD — no ratings/reviews, none exist); `globals.css` (Tailwind v4 `@theme` tokens: ember `#FF3300`, ink `#111111`, paper `#FFFFFF`, marigold `#FFB020`; Montserrat display / Inter sans via `next/font`; `:focus-visible` Ember outline; `prefers-reduced-motion` reset; tap-to-talk pulse keyframes).
- **Build:** `@dad-ai/site` 0.1.0, Next.js 15.3 / React 19, `transpilePackages: ['@dad-ai/shared','@dad-ai/ui']`, dev port 3001. Byte assets: 3 webp files in `public/byte/`.

### What remains unverified

- **Repo write access:** GitHub App writes for `Dad-ai` are untested and presumed blocked — sibling repo `kaprafoods-sketch/guruprakash-cables` returned 403 "Resource not accessible by integration" on 2026-10-17. Jatin must add `Dad-ai` to the Muse GitHub App's repository access (GitHub → Settings → Applications → Muse GitHub App) before anything can be pushed to `nirmaanco/migration`.
- **Domain:** `nirmaanco.in` is a plan, not a confirmation. No DNS, Vercel, or `vercel.json`/`render.yaml` changes were made.
- **Analytics / Search Console:** not configured — baselines are honest zeros.
- **Live deployments:** Vercel/Render targets never inspected; `pnpm typecheck`/`build` for the new app not yet run (verify pass pending).

---

Status / last verified: 2026-10-17
