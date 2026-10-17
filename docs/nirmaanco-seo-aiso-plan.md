# Nirmaanco SEO & AI-Search-Optimization (AISO) Plan

Technical SEO as **actually implemented** in `apps/site` (2026-10-17) vs. not yet done, plus the content-authority and measurement approach.

## 1. Technical SEO — implemented

- **Page metadata:** every route has a unique `title` (template `%s | Nirmaanco`), a unique meta `description`, and a per-page canonical via `alternates: { canonical }`.
- **Canonicals / base URL:** `metadataBase` from `SITE_URL = NEXT_PUBLIC_SITE_URL ?? 'https://nirmaanco.in'` — one env var flips the whole site when the domain is confirmed.
- **`robots.ts`:** `allow: /` for all crawlers, with `sitemap:` reference derived from `SITE_URL`. No `noindex` on any content page.
- **`sitemap.ts`:** all 13 content routes, `lastModified: now`, `changeFrequency: 'weekly'`, priority 1.0 (`/`), 0.7 (others).
- **OG / Twitter:** Open Graph (website, `en_IN` locale, siteName "Nirmaanco") and Twitter `summary_large_image` on the root layout; per-page titles/descriptions flow through. **OG images are not yet real** — no `og-image` file exists; cards will render text-only until designed.
- **Favicon:** `/favicon.svg` — Ember `#FF3300` rounded square with an "N" glyph.
- **JSON-LD:** Organization + WebSite schema injected in the root layout from `site-config.ts`. **No ratings, reviews, or aggregateRating** — none exist and none are claimed.
- **Semantic HTML / a11y:** semantic landmarks (`header`/`main`/`footer`, `article`, labelled `nav`s), logical heading order, skip-to-content link, `:focus-visible` Ember outline, `prefers-reduced-motion` reset, labelled form controls with `aria-invalid`/`aria-describedby`, `role="alert"` error states, keyboard-operable mobile menu. Screen-reader pass with a real SR still pending.
- **Performance posture:** server components for all SEO pages (no client-rendered SEO content), `next/font` self-hosted fonts (`display: swap`), `next/image` for the Byte asset, no external scripts, no analytics payload yet. No Core Web Vitals measured — record real numbers after deploy, never assumed scores.

## 2. Not yet done

- **Search Console verification:** cannot happen before the domain is confirmed and the site is deployed. Owner TBD.
- **Analytics:** no provider chosen (GA4 / PostHog / Vercel Analytics undecided) — nothing wired.
- **Real OG images:** design and export `og-image` assets per key page (home, services, guides); until then, social cards are text-only.
- **Redirect map:** **none needed and none created** — the site is net-new; there are no old URLs to preserve or redirect. If the domain changes later, canonicals move via the env var and a redirect map only matters for already-indexed URLs.
- **Robots refinements:** current rule is permissive (`allow: /`). Review against official crawler guidance (Google, OpenAI) post-launch; do not allow unsafe or unrelated bots indiscriminately.

## 3. Content authority clusters

Three clusters (per the master prompt direction), mapped to existing and planned content:

1. **Practical AI tools** — tool comparisons, "Byte Finds" guides, underrated features and tech hacks. _Existing:_ none yet (planned). _Candidates:_ AI tool comparison guides, Hindi-lane practical tutorials.
2. **AI automation** — agents, chatbots, workflow automation, integrations. _Existing:_ `/knowledge/ai-receptionist-webchat` (webchat contract, limits). _Planned:_ n8n bridge / workflow guides grounded in the real platform.
3. **Business AI solutions** — CRM/process improvements, lead systems, implementation trade-offs. _Existing:_ `/knowledge/document-ai-pipeline` (RAG pipeline, limits). _Planned:_ Document AI for business workflows, enquiry-to-CRM pipeline walkthrough.

Rules: no thin programmatic pages, no dozens of keyword variants, no empty category pages. Every guide must have a clear user purpose and internal links to related guides + the relevant service page (content → service linkage is the conversion path). See `nirmaanco-content-model.md` for categories, workflow, and editorial rules.

## 4. Crawler checks (pre-launch)

- [x] `robots.txt` valid, allows content pages, names the sitemap
- [x] `sitemap.xml` lists all content routes with absolute URLs
- [x] Canonicals self-referential and absolute (via `metadataBase`)
- [x] No accidental `noindex` (only `not-found.tsx` is noindexed — correct)
- [x] Structured data matches visible content (no fake reviews/ratings)
- [ ] Verify in Search Console after deploy (pending)
- [ ] Fetch-as-Google / URL inspection on the live domain (pending)
- [ ] Check crawler access rules against current official docs (Google, OpenAI) post-launch (pending)

## 5. Measurement baseline

**Nothing is configured, so the baseline is honest zeros.** Do not invent baselines. Track once tooling is live:

- Search impressions and clicks (Search Console)
- Indexed pages and technical errors
- Organic landing pages and qualified visits
- Enquiry form starts, successful submissions, failures (privacy-controlled, only with analytics actually configured)
- Qualified enquiries by source
- Referring domains and meaningful mentions where measurable
- Monthly AI-assistant visibility audit (see §6)

## 6. Monthly AI-visibility audit method

**Purpose:** a research metric on how AI assistants surface Nirmaanco — not proof of rankings and never a promise of inclusion.

- **Fixed prompt set:** a small, stable set of prompts asked verbatim each month across assistants (e.g. ChatGPT, Claude, Gemini, Perplexity), covering: "AI tools for Indian creators", "AI receptionist / AI chatbot for small business India", "document AI / RAG pipeline explained", plus 2–3 brand queries ("what is Nirmaanco").
- **Record per prompt:** whether Nirmaanco appears, whether it is cited (with URL), which competitor sources appear instead, factual accuracy of what is said about Nirmaanco, and content gaps the answers reveal.
- **Cadence:** monthly, same prompts, same assistants where possible; log date, assistant, and exact wording.
- **Interpretation:** AI answers vary by query, time, location, and product. Visibility ≠ leads. **Never claim or imply guaranteed AI recommendations.** Use gaps found to steer the content plan (clusters above), not to promise outcomes.

---

Status / last verified: 2026-10-17
