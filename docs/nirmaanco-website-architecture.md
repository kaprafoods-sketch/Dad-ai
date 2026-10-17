# Nirmaanco Website Architecture

Describes the **actual** `apps/site` implementation (built 2026-10-17) and the technical decisions behind it.

## 1. Sitemap — all routes and their purpose

| Route                                | File                                             | Purpose                                                                                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                  | `app/page.tsx`                                   | Home: hero (value prop, audiences, primary CTA), capability summary (Digital Presence / Digital Growth / AI & Automation), platform features mapped to real repo capabilities, how-we-work steps, knowledge teaser, Byte editorial feature, tap-to-talk demo, conversion block, footer |
| `/services`                          | `app/services/page.tsx`                          | Services landing: the three offers side-by-side, how to choose                                                                                                                                                                                                                         |
| `/services/digital-presence`         | `app/services/digital-presence/page.tsx`         | Service detail: websites and digital foundations — who it's for, problem, deliverables, engagement, scope                                                                                                                                                                              |
| `/services/digital-growth`           | `app/services/digital-growth/page.tsx`           | Service detail: lead generation, content systems, CRM, follow-up                                                                                                                                                                                                                       |
| `/services/ai-automation`            | `app/services/ai-automation/page.tsx`            | Service detail: AI receptionist, document AI, workflow automation — mapped ONLY to real platform capabilities (no fabricated offerings)                                                                                                                                                |
| `/knowledge`                         | `app/knowledge/page.tsx`                         | Knowledge hub index: guide cards with category, read time, blurb                                                                                                                                                                                                                       |
| `/knowledge/document-ai-pipeline`    | `app/knowledge/document-ai-pipeline/page.tsx`    | Guide: how the Document AI pipeline works (upload → worker → chunk/embed in pgvector → RAG) and its current limits                                                                                                                                                                     |
| `/knowledge/ai-receptionist-webchat` | `app/knowledge/ai-receptionist-webchat/page.tsx` | Guide: the `POST /v1/conversations/webchat` contract, API requirements, current limits                                                                                                                                                                                                 |
| `/work`                              | `app/work/page.tsx`                              | Work: **honest empty state** — states that case studies will appear here as completed; explicitly refuses to fabricate logos, metrics, or testimonials                                                                                                                                 |
| `/about`                             | `app/about/page.tsx`                             | About Nirmaanco: what the company does, approach (agency + tech-media brand), Byte introduction                                                                                                                                                                                        |
| `/contact`                           | `app/contact/page.tsx`                           | Contact / start-a-project: enquiry steps + `ContactForm`                                                                                                                                                                                                                               |
| `/privacy`                           | `app/privacy/page.tsx`                           | Privacy policy (last updated Oct 2026) — covers contact-form data collection                                                                                                                                                                                                           |
| `/terms`                             | `app/terms/page.tsx`                             | Terms of service (last updated Oct 2026)                                                                                                                                                                                                                                               |
| `/robots.txt`                        | `app/robots.ts`                                  | `allow: /`, sitemap reference — derived from `SITE_URL`                                                                                                                                                                                                                                |
| `/sitemap.xml`                       | `app/sitemap.ts`                                 | 13 content routes, `lastModified: now`, weekly, priority 1.0 for `/`, 0.7 others                                                                                                                                                                                                       |
| `(404)`                              | `app/not-found.tsx`                              | Not-found page with `robots: { index: false, follow: false }`                                                                                                                                                                                                                          |

Every page carries its own `metadata` (title template `%s | Nirmaanco`, unique description, canonical). Layout injects Organization + WebSite JSON-LD. No old URLs existed, so there is no redirect map (site is net-new).

## 2. User journeys

### Journey A — Visitor → Knowledge → Enquiry

1. Lands on `/` (hero names Nirmaanco, audiences served, "Discuss a Project" primary CTA).
2. Clicks a knowledge teaser or nav "Knowledge" → `/knowledge` → picks a guide (e.g. Document AI pipeline) — sees real implementation detail, current limits, related service link.
3. Related-service link or CTABand → service page → answers who/what/scope → `/contact`.
4. Fills `ContactForm` (client validation, clear error states) → POST to CRM as a lead → success state. If API unconfigured, an honest "not configured yet — email us instead" banner appears and submission is blocked (no fake success).

### Journey B — Visitor → Demo → Contact

1. Lands on `/`, scrolls to the Tap-to-talk section ("Live demo" badge, English/Hindi language selector).
2. Taps to talk → browser speech recognition captures speech (mic-denied and unsupported-browser states handled) → transcript posted to `POST /v1/conversations/webchat` → AI Receptionist reply spoken back via speech synthesis (`idle → listening → sending → speaking` states).
3. If `NEXT_PUBLIC_API_URL` is unset: the demo refuses with "Live demo unavailable — API not configured" — no broken call, no fake reply.
4. Demo copy clarifies: web demo of the same agent that can answer WhatsApp/email/webchat — **not a phone call**. CTA beside the demo routes to `/contact`.

## 3. Component architecture

Components live in `app/components/` (one component per file). All are **server components by default**; only `SiteHeader`, `ContactForm`, and `TapToTalk` are `'use client'`.

| Component       | Props                                                                                                              | State approach                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SiteHeader`    | none (reads `NAV` from site-config)                                                                                | `useState` for mobile menu open/close; `usePathname` for active-link state                                                                                                                              |
| `SiteFooter`    | none                                                                                                               | stateless; maps `NAV` + policy links                                                                                                                                                                    |
| `Hero`          | `eyebrow?`, `title`, `highlight?`, `subtitle`, `primaryCta?`, `secondaryCta?` (each `{label, href}`)               | stateless; defaults: primary "Discuss a Project" → `/contact`                                                                                                                                           |
| `CTABand`       | `title?`, `subtitle?`, `ctaLabel?`                                                                                 | stateless; always routes to `/contact`                                                                                                                                                                  |
| `ServiceDetail` | `eyebrow`, `title`, `highlight?`, `intro`, `who`, `problem`, `deliverables[]`, `engagement`, `scope`, `related?[]` | stateless composed template (Hero + sections + CTABand)                                                                                                                                                 |
| `ByteFeature`   | none                                                                                                               | stateless; renders the 4 editorial series + `/byte/byte-pointing.webp`                                                                                                                                  |
| `ContactForm`   | none (reads `API_URL`, `DEV_TENANT_ID` from site-config)                                                           | `useState` per field + `errors` map + `status: idle\|sending\|success\|error`; client-side validation (required name/email/message, email regex); explicit API-missing banner                           |
| `TapToTalk`     | none (reads `API_URL`, `DEV_TENANT_ID`)                                                                            | `useState`: `lang` (en-IN/hi-IN), `state: idle\|listening\|sending\|speaking`, `transcript`, `reply`, `notice`, `conversationId`, `supported`; `useRef` for the recognition instance and a state mirror |

No shared UI library components are imported (the hand-rolled `@dad-ai/ui` Button is dashboard-style, not marketing-style; marketing styling is plain Tailwind). All copy lives in the page files (no CMS, no content files — see §4).

## 4. Content models

**Guides are static TSX for now — there is no frontmatter, no MDX, no CMS.** Each guide is a page component under `app/knowledge/<slug>/page.tsx` with:

- `export const metadata` (title, description, canonical)
- An `<article>` with an eyebrow ("Guide"), h1, intro, sections, a "current limits" block (honesty requirement), and a `CTABand` or related-service `Link`
- Index registration: a hardcoded `GUIDES` array in `app/knowledge/page.tsx` (slug, title, blurb) rendered as cards

Publishing a new guide = add a folder + page.tsx + one entry in the `GUIDES` array, then run typecheck + build. This is deliberate (see §5, "no CMS"): with a low publishing cadence and zero CMS infra in the repo, static pages are the simplest sustainable approach; revisit when cadence or non-technical authors demand it.

Other content types are fixed one-off pages: service pages (via `ServiceDetail` template), `/work` (empty state until real case studies exist), `/about`, `/contact`, `/privacy`, `/terms`.

## 5. Technical decisions

1. **New `apps/site` vs expanding `apps/customer`.** The customer app is a client-rendered SaaS dashboard with no marketing surface, no metadata, no assets; expanding it would entangle marketing SEO with app auth logic. A separate Next.js 15 app keeps the platform (customer/admin/api/worker) untouched and gives the site SSR/server-component SEO from day one. Monorepo tooling (turbo, shared tsconfig) carries over with no changes.
2. **`@dad-ai/*` scope kept.** Renaming to `@nirmaanco/*` is internal churn with zero user-visible benefit; `@dad-ai/shared` and `@dad-ai/ui` are already in `transpilePackages` and the package name is `@dad-ai/site`.
3. **Tailwind v4 CSS-first tokens.** Brand palette as `@theme` variables in `globals.css`: `--color-ember #FF3300`, `--color-ink #111111`, `--color-paper #FFFFFF`, `--color-marigold #FFB020` (the #FFB020 Amber accent). No design-token files elsewhere in the repo to conflict with.
4. **`next/font` for typography.** Montserrat (700/800, display) + Inter (sans), `display: swap` — self-hosted, no external font requests; matches the master-prompt direction (bold geometric sans).
5. **No CMS.** Static TSX guides in-repo; no CMS exists in the platform and introducing one for a handful of guides would add maintenance cost with no demand. Publishing workflow is a documented file addition (see content model doc).
6. **Contact → CRM.** `POST ${API_URL}/v1/crm/contacts` with body **exactly `{ type: 'lead', name, email }`** — copied from the proven shape in `apps/customer/app/dashboard/crm/page.tsx`. The API's zod schema accepts only `type`, `name`, `phone`, `email`, `customFields`, so extra form fields (business, website, service interest, message, budget) are collected for visitor context only and deliberately NOT sent. `x-tenant-id` header is attached **only when `NEXT_PUBLIC_DEV_TENANT_ID` is set** (dev/preview context).
7. **Tap-to-talk → webchat.** `POST ${API_URL}/v1/conversations/webchat` with body `{ message, conversationId }`, matching the contract in `apps/customer/app/dashboard/inbox/page.tsx` (`{ message, conversationId? }` → `{ conversationId, reply }`). Browser Web Speech API for capture/synthesis; dev tenant header under the same condition as (6).
8. **API_URL-missing UI states.** `NEXT_PUBLIC_API_URL` has **no localhost fallback**. When unset, `ContactForm` shows an honest banner and blocks submission; `TapToTalk` refuses with an explanatory notice. No fake successes, no dead CTAs.
9. **Canonical from `NEXT_PUBLIC_SITE_URL`, defaulting to planned `nirmaanco.in`.** `SITE_URL` = env ?? `https://nirmaanco.in`. One env var flips metadataBase, canonicals, robots, sitemap, OG URLs, and JSON-LD `url` when the domain is confirmed. All email/brand config carries a "PLANNED domain — confirm before production use" comment.

---

Status / last verified: 2026-10-17
