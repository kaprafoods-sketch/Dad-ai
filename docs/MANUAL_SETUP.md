# Manual Setup Checklist

Everything in this repo is code — it compiles, typechecks, tests, and builds
today. This file lists the **manual, human-only steps** to take it from
"runs locally with stubs" to "live in production." Work top to bottom; each
section says which phase it unblocks.

Legend: 🔑 = create an account / get a key · ⚙️ = run a command · 🖱️ = click in a dashboard

---

## 0. Local dev (do this first — no external accounts needed)

- ⚙️ `pnpm install`
- ⚙️ `pnpm db:generate` (generates the Prisma client into `packages/db/generated`)
- ⚙️ `cp .env.example .env`
- ⚙️ Run the API with the dev auth bypass (no Supabase needed yet):
  `DEV_AUTH_BYPASS=1 pnpm --filter @dad-ai/api dev`
- ⚙️ Run the customer app: `pnpm --filter @dad-ai/customer dev`
  - set `NEXT_PUBLIC_DEV_TENANT_ID` to any UUID to send the dev tenant header
- The CRM/board/inbox screens will load but return empty until a database is
  connected (next section).

---

## 1. Supabase — database, auth, storage (unblocks Phase 0–1)

1. 🔑 Create a Supabase project (choose the region closest to your customers;
   India → `ap-south-1` when available). Do this **three times**: `dev`,
   `staging`, `prod`.
2. 🖱️ In each project: **Database → Extensions →** enable `vector` (pgvector).
3. 🔑 Copy into `.env` (and into each deploy environment):
   - `DATABASE_URL` and `DIRECT_URL` (Project Settings → Database → Connection string; use the **pooled** URL for `DATABASE_URL`, the direct one for `DIRECT_URL`)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET` (Project Settings → API → JWT Secret) — the API verifies tokens with this
4. ⚙️ Run the migration: `pnpm db:migrate` (or apply `prisma/migrations` via `prisma migrate deploy` in CI/prod).
5. ⚙️ Apply row-level security: run `prisma/rls.sql` against the database
   (Supabase SQL editor, or `psql "$DIRECT_URL" -f prisma/rls.sql`).
   **Do not skip this** — it's the hard tenant-isolation floor.
6. 🖱️ Configure Auth providers (Authentication → Providers): Google, Microsoft,
   email/magic-link. Set the site URL and redirect URLs to your app domains.
7. 🖱️ Add a custom-claims hook (Authentication → Hooks, or a Postgres function)
   that injects `tenant_id` (and optionally `role_dadai`) into the JWT at login.
   The API's `verifySupabaseJwt` and all RLS policies depend on this claim.
   👉 This is the one non-obvious Supabase step — the whole tenancy model rests on it.
8. 🖱️ Create a **private** Storage bucket for documents. Never make it public;
   the app issues short-TTL signed URLs.
9. ⚙️ Seed tenant #0 (your agency) — run from `packages/db` so the swc runner
   resolves: `cd packages/db && node -r @swc-node/register ../../prisma/seed.ts`
   (set `AGENCY_OWNER_EMAIL` first). Then invite yourself as the OWNER user in
   Supabase Auth with the same email.

---

## 2. Redis / queues (unblocks the document pipeline + all background work)

1. 🔑 Create an Upstash Redis database.
2. 🔑 Put its connection string in `.env` as `REDIS_URL`.
3. ⚙️ Run the worker: `pnpm --filter @dad-ai/worker dev`.
   Without `REDIS_URL` the worker exits on start and the API can't enqueue
   `doc.process` jobs (document uploads will 500 with a clear message).

---

## 3. OpenRouter — LLMs (unblocks AI chat + receptionist)

1. 🔑 Create an OpenRouter account, add credit, create an API key.
2. 🔑 `OPENROUTER_API_KEY` in `.env`.
3. (Optional) 🔑 Embeddings: set `EMBEDDINGS_API_KEY` (+ `EMBEDDINGS_BASE_URL`
   if not OpenAI). Without it, documents are chunked and stored but not
   embedded — RAG search returns nothing until you backfill embeddings.
4. Review the routing policy in `packages/ai/src/index.ts` (`MODEL_ROUTING`)
   and swap model slugs to your preference/budget.

---

## 4. Channels & connectors (unblocks Phase 2–3, build in this order)

- **WhatsApp Cloud API** 🔑: Meta Business account, WhatsApp app, phone number,
  permanent token → `WHATSAPP_CLOUD_API_TOKEN`. 🖱️ Point the webhook at
  `/v1/webhooks/whatsapp` (endpoint is Phase 2 work).
- **Google** 🔑: Google Cloud project, OAuth consent screen, Calendar/Gmail/Drive
  scopes, client id/secret. 🖱️ Redirect URI → `/v1/connectors/google/callback`.
- **Resend** 🔑 (email): `RESEND_API_KEY`, verify your sending domain (DNS).
- **Twilio** 🔑 (SMS/voice): account SID + auth token; voice is Phase 4.
- **Vertical lead sources** 🔑 (99acres, MagicBricks, Naukri, LinkedIn…):
  partner/API access per portal — obtained when you launch that vertical.
- 🔑 Set `CREDENTIALS_ENCRYPTION_KEY` to a 32-byte hex string — connector tokens
  are AES-256-GCM encrypted at rest with it. Generate: `openssl rand -hex 32`.

---

## 5. Billing — Razorpay (unblocks Phase 3 revenue)

1. 🔑 Razorpay account (KYC/business verification takes days — start early).
2. 🔑 `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. 🖱️ Create Plans in the Razorpay dashboard matching Starter/Pro/Business.
4. 🖱️ Add a webhook → `/v1/billing/webhooks/razorpay`, subscribe to
   `subscription.*` and `payment.*` events, and set the signing secret as
   `RAZORPAY_WEBHOOK_SECRET`. (Signature verification is already implemented.)

---

## 6. Workflow engine — n8n (unblocks Phase 2 automations)

1. 🔑 Deploy a self-hosted n8n instance (Railway/Fly, ~$10/mo).
2. 🔑 `N8N_BASE_URL`, `N8N_API_KEY` in `.env`.
3. The `packages/workflow` bridge and platform events are stubbed; the n8n
   API implementation is Phase 2.

---

## 7. Deployment (unblocks going live)

- 🖱️ **Vercel**: import the repo, create two projects (`apps/customer`,
  `apps/admin`), set root directories and env vars. Admin app: add IP allowlist
  or admin SSO.
- 🖱️ **Railway/Fly**: deploy `apps/api` and `apps/worker` as two services with
  the same env. API build: `pnpm --filter @dad-ai/api build`.
- 🔑 `ADMIN_API_KEY`: set a strong secret; the admin endpoints and tenant
  provisioning require it via the `x-admin-key` header.
- 🖱️ Point DNS: `{tenant}.dadai.app` wildcard → customer app; `admin.dadai.app`
  → admin app.
- 🖱️ **Sentry** 🔑 + a log drain (Axiom/Betterstack) for monitoring.
- The GitHub Actions CI (`.github/workflows/ci.yml`) already runs
  install → generate → validate → lint → typecheck → test → build on every PR.
  Add deploy steps + secrets when you're ready to auto-deploy.

---

## Environment variables — quick reference

See `.env.example` for the full list. The ones without which specific features
degrade gracefully (with clear error messages) rather than crashing:

| Missing var               | Effect                                                        |
| ------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`            | API can't serve data (everything 500s) — required             |
| `SUPABASE_JWT_SECRET`     | Real auth fails; use `DEV_AUTH_BYPASS=1` for local dev        |
| `REDIS_URL`               | Worker won't start; document uploads 500 with a clear message |
| `OPENROUTER_API_KEY`      | Webchat returns 503 "receptionist offline"; CRM still works   |
| `EMBEDDINGS_API_KEY`      | Docs stored but not embedded; RAG search empty                |
| `ADMIN_API_KEY`           | Admin + provisioning endpoints return 401                     |
| `RAZORPAY_WEBHOOK_SECRET` | Billing webhook returns 400                                   |
