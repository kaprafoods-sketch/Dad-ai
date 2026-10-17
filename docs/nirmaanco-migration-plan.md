# Nirmaanco Migration Plan

Phases P0–P5, priorities, dependencies, acceptance criteria, risks, and rollback notes. Covers both what is done and what remains.

## P0 — Audit and protect ✅ DONE (2026-10-17)

- **Work:** read-only inspection of the repo via GitHub connector; brand-occurrence inventory; unknowns register.
- **Delivered:** `docs/nirmaanco-migration-audit.md` (Phase 0 header + full audit + post-audit build status).
- **Acceptance criteria:** audit names stack, routes, features to preserve, SEO/a11y observations, debt/risks, and unknowns — all met.
- **Key decision recorded:** no existing website to convert → net-new `apps/site`, platform untouched.

## P1 — Brand and UX foundation ✅ DONE (2026-10-17)

- **Work:** 10 one-line brand edits in the platform (`git diff --stat`: 10 files, 12+/11−) — metadata, sidebar wordmark, seed tenant name, pack description, RESEND_FROM defaults (marked "PLANNED domain — confirm before production use"), schema comment, README title.
- **Delivered:** Nirmaanco tokens (`globals.css` `@theme`: ember/ink/paper/marigold), `next/font` (Montserrat + Inter), global layout (header/footer/skip link/JSON-LD/canonical), favicon, robots/sitemap.
- **Acceptance criteria:** no "Dad AI" remains in user-visible platform surfaces except internal identifiers (npm scope, `AGENCY_SLUG`, `role_dadai` claim, `render.yaml` service names — all deliberately kept); site renders with consistent brand. Met.
- **Dependency:** P0 audit complete.

## P2 — Core business pages and conversion ✅ DONE (build complete, verification pending)

- **Work:** `apps/site` scaffolded — 13 content routes, 8 components, contact form, tap-to-talk demo, knowledge hub with 2 guides, work page with honest empty state, about, privacy, terms.
- **Acceptance criteria:** every route returns 200 with correct metadata/canonicals; contact form validates client-side and POSTs `{type:'lead',name,email}` only; tap-to-talk states all reachable (idle/listening/sending/speaking + all error states); no fabricated testimonials, logos, metrics, or case studies anywhere. Build complete — **verify pass (P5) still pending**.
- **Dependency:** P1 tokens/layout. **Blocked until P5:** public claim of completion.

## P3 — Content engine and SEO/AISO 🔲 PARTIAL

- **Done:** content taxonomy defined, 2 seed guides published, internal links between guides and services, technical SEO primitives (metadata, canonicals, robots, sitemap, OG/Twitter, favicon, JSON-LD, semantic HTML, a11y baseline).
- **Not done:** Search Console verification, analytics wiring, real OG images, AI-visibility audit runs, content authority map execution.
- **Acceptance criteria:** all technical SEO checks green; a publishing workflow documented (done — see content model doc); first AI-visibility audit run recorded. Partial.
- **Dependencies:** P2 routes live; domain decision for canonical stability.

## P4 — Platform continuity ✅ PRESERVED (ongoing)

- **Work:** zero changes to API/worker/customer behavior — only one-line brand text edits. `@dad-ai/*` scope, `IndustryPack.AGENCY`, `role_dadai` claim, `AGENCY_SLUG` data default, `render.yaml` service names all kept.
- **Acceptance criteria:** existing CI (install → Prisma → lint → typecheck → test → build) still passes; no DNS/deploy/auth/DB changes made. CI not yet run on the new tree — part of the P5 verify pass.
- **Risk:** low; additive-only diff.

## P5 — QA and launch readiness 🔲 PENDING

- **Work:** run `pnpm --filter @dad-ai/site typecheck` and `build`; repo-level `pnpm lint` (prettier), `typecheck`, `test`; manual route/link/form/responsive/a11y pass; record results in `docs/nirmaanco-launch-checklist.md`.
- **Acceptance criteria:** all quality gates pass or failures documented with precise causes; unresolved-issues list current; launch blocked items (domain, Vercel wiring, GitHub write access) tracked.
- **Dependencies:** GitHub App write access for push; Vercel project wiring for deploy.

## Vercel project wiring (new app — NOT yet done)

The new app needs its own deployment target. **Do not change the existing `vercel.json` (customer app), `render.yaml`, or DNS.**

- **New Vercel project** (or a monorepo project addition for `@dad-ai/site`), following the existing `apps/customer/vercel.json` pattern:
  - Build command: `cd ../.. && pnpm --filter @dad-ai/site build`
  - Install command: `cd ../.. && pnpm install`
  - Framework: `nextjs`
  - Environment variables: `NEXT_PUBLIC_SITE_URL` (canonical domain once confirmed), `NEXT_PUBLIC_API_URL` (platform API root, e.g. Render service URL — required for contact form and tap-to-talk to be live), optionally `NEXT_PUBLIC_DEV_TENANT_ID` (preview only — never production).
- Root directory / project settings must point at `apps/site` within the monorepo.
- **Explicitly out of scope without authorization:** changing the existing customer/admin Vercel projects, `render.yaml`, DNS records, or custom domains.

## Push plan

- **Target branch:** `nirmaanco/migration` (new branch off `claude/dad-ai-saas-plan-sagmfn`).
- **Blocker:** GitHub App write access. Writes currently fail with 403 **"Resource not accessible by integration"** (confirmed on the sibling repo `kaprafoods-sketch/guruprakash-cables` on 2026-10-17; `Dad-ai` writes untested but the App's repository selection is presumed not to include it).
- **Fix:** Jatin → GitHub → Settings → Applications → Muse GitHub App → Repository access → add `Dad-ai` (and select the repo). Only then push the working tree (`apps/site/` + the 10-file P1 diff + these docs).
- Rollback of the push is trivial: the branch is additive; delete it or revert before any merge.

## Open decisions

1. **Domain confirmation** — `nirmaanco.in` is planned, unconfirmed. Everything derives from `NEXT_PUBLIC_SITE_URL`; confirm before setting canonicals in production.
2. **Analytics provider** — GA4 / PostHog / Vercel Analytics / none. Nothing wired; baselines are honest zeros until chosen.
3. **Enquiry enrichment** — the form sends only `{type:'lead',name,email}` today. Richer payloads via `customFields` are possible once the API's `createContactSchema` zod allows it; server-side spam protection (rate limiting, honeypot/turnstile) is still to be decided.
4. **Byte asset usage beyond hero** — 3 webp assets exist (`byte-pfp`, `byte-pointing`, `byte-board`); only `byte-pointing` is used (ByteFeature). PFP/board usage in footer, knowledge cards, or social previews is undecided.
5. **Knowledge publishing cadence** — no CMS by design; cadence and the 40/25/25/10 editorial allocation are initial assumptions to validate against real capacity.
6. **Search Console ownership** — who verifies and when (needs the live domain first).

## Risks and rollback

- **Risk 1 — Domain never confirmed:** canonicals point at `nirmaanco.in` by default; mitigated by deriving everything from one env var.
- **Risk 2 — API not reachable from Vercel:** contact form and tap-to-talk degrade to honest "not configured" states rather than failing silently; verify `NEXT_PUBLIC_API_URL` + CORS (`CORS_ORIGINS` on the API) at deploy time.
- **Risk 3 — Repo write access stays blocked:** docs and code accumulate locally; push later on the same branch.
- **Rollback:** all platform changes are ten one-line brand edits — `git revert` per file or one revert commit. `apps/site/` is untracked and additive — delete the directory to roll back the site entirely. No migrations, no data changes, no DNS changes to unwind.

---

Status / last verified: 2026-10-17
