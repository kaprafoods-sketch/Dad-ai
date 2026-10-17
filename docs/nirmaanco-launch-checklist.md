# Nirmaanco Launch Checklist

Pre-launch verification for `apps/site`. Each item must be checked against the **built code**, not the plan. Items not yet run are marked **PENDING VERIFICATION**.

## 1. Build & quality

- [x] **VERIFIED 2026-10-17** — `pnpm --filter @dad-ai/site typecheck` passes (tsc --noEmit; 2 real errors found and fixed during build)
- [x] **VERIFIED 2026-10-17** — `pnpm --filter @dad-ai/site build` passes (next build, 18/18 static pages)
- [x] **VERIFIED 2026-10-17** — repo-level `pnpm lint` (prettier --check) clean for new files
- [x] **VERIFIED 2026-10-17** — customer/admin/notify typecheck green; full turbo build of api/worker not run (out of scope, untouched by this diff)
- [ ] No console errors on any route (manual browser pass — pending)

## 2. Routes & links

- [x] **VERIFIED 2026-10-17** — all 13 content routes return 200 at runtime (`next start` + curl): `/`, `/services`, `/services/digital-presence`, `/services/digital-growth`, `/services/ai-automation`, `/knowledge`, `/knowledge/document-ai-pipeline`, `/knowledge/ai-receptionist-webchat`, `/work`, `/about`, `/contact`, `/privacy`, `/terms`
- [x] **VERIFIED 2026-10-17** — `/robots.txt` and `/sitemap.xml` serve correctly (sitemap lists all routes under planned `nirmaanco.in` canonical)
- [x] **VERIFIED 2026-10-17** — unknown paths render the custom 404 (`/nonexistent-page-xyz` → 404)
- [x] **VERIFIED 2026-10-17** — no dead links: 18 unique internal links across 5 pages all return 200. One broken link found and fixed: `/favicon.svg` 404'd because `app/favicon.svg` is not a Next.js metadata convention — moved to `public/favicon.svg`, re-verified 200.
- [ ] Responsive at mobile, tablet, laptop, wide desktop; no horizontal overflow at common widths (needs browser viewport pass)

## 3. Forms & CTAs

- [x] **CODE-VERIFIED 2026-10-17** — Contact form: all inputs have `<label>` elements, required-field validation + email checks in code; inline error states present. Runtime submission needs a live `NEXT_PUBLIC_API_URL` (not tested — no backend here).
- [x] **CODE-VERIFIED 2026-10-17** — Contact form with `NEXT_PUBLIC_API_URL` unset: honest "not configured" banner in code, submission blocked (no fake success).
- [x] **CODE-VERIFIED 2026-10-17** — Contact form POST body is exactly `{ type: 'lead', name, email }` per the API zod schema; `x-tenant-id` only when `NEXT_PUBLIC_DEV_TENANT_ID` set. Extra UI fields (business, website, interest, budget) are context-only, documented in code.
- [x] **CODE-VERIFIED 2026-10-17** — Tap-to-talk: idle → listening → sending → speaking state machine; en-IN / hi-IN language switch; interim + final transcripts; reply spoken via speechSynthesis. Runtime mic test not possible in this environment.
- [x] **CODE-VERIFIED 2026-10-17** — Tap-to-talk degraded states all handled with specific notices: unsupported browser, mic denied (`not-allowed`), API unconfigured, API error (includes hint about OPENROUTER_API_KEY / seeded agent).
- [x] **CODE-VERIFIED 2026-10-17** — Tap-to-talk copy frames it as a "live demo … not a phone call"; no telephony or latency claims anywhere.
- [ ] Primary CTA "Discuss a Project" → `/contact` works from every page (link targets verified in link sweep; click-path needs browser pass)

## 4. SEO

- [x] Unique titles, descriptions, canonicals on all 13 routes (**runtime-verified 2026-10-17**: homepage serves `<title>Nirmaanco — Build Smarter. Grow Faster.</title>`, meta description, canonical `https://nirmaanco.in`, OG tags with `en_IN` locale)
- [x] `robots.ts` allows crawling and names the sitemap (**runtime-verified 2026-10-17**: serves `User-Agent: * / Allow: /` + sitemap reference)
- [x] `sitemap.ts` lists all content routes with absolute URLs (**runtime-verified 2026-10-17**: valid XML, all routes present)
- [x] Organization + WebSite JSON-LD present, no fake reviews/ratings (**runtime-verified 2026-10-17**: both `@type` blocks in homepage HTML)
- [x] OG/Twitter defaults + `en_IN` locale, favicon (**runtime-verified 2026-10-17**: `/favicon.svg` serves 200 after moving from `app/` to `public/`)
- [ ] **PENDING** — Search Console verification (blocked: domain unconfirmed, site not deployed)
- [ ] **PENDING** — analytics wired and baselines recorded (blocked: provider undecided)
- [ ] **PENDING** — real OG images designed (text-only cards until then)
- [ ] N/A — redirect map (no old URLs exist; site is net-new)

## 5. Accessibility

- [x] Skip-to-content link, semantic landmarks, labelled navs, logical headings (verified in code)
- [x] `:focus-visible` Ember outline, `prefers-reduced-motion` reset (verified in code)
- [x] Form labels, `aria-invalid`, error `role="alert"`, keyboard-operable mobile menu (verified in code)
- [ ] **PENDING VERIFICATION** — full screen-reader pass (NVDA/VoiceOver) on home, contact, and a guide
- [ ] **PENDING VERIFICATION** — keyboard-only walkthrough of tap-to-talk and the contact form
- [ ] **PENDING VERIFICATION** — contrast spot-check on Ember-on-paper and paper-on-ink text

## 6. Content

- [x] No fabricated claims (verified in code): `/work` is an explicit empty state; guides document current limits; JSON-LD has no ratings; tap-to-talk makes no latency or telephony claims; brand promise "Build Smarter. Grow Faster." used as direction, not repeated as proof
- [x] Byte presented as editorial character within Nirmaanco, not a separate brand (verified in code)
- [ ] **PENDING** — Jatin's final copy review before any publish (Day-1 launch script and any reel copy still need his approval)

## 7. Deploy (BLOCKED — do not deploy until resolved)

1. **Domain decision** — `nirmaanco.in` is planned, unconfirmed. Nothing deployed, no DNS changed.
2. **Vercel wiring** — new project for `@dad-ai/site`: build `cd ../.. && pnpm --filter @dad-ai/site build`, install `cd ../.. && pnpm install`, framework nextjs; env `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` (+ `NEXT_PUBLIC_DEV_TENANT_ID` for preview only). Do NOT touch existing `vercel.json`, `render.yaml`, or DNS.
3. **GitHub write access** — push to new branch `nirmaanco/migration` only after Jatin adds `Dad-ai` to the Muse GitHub App's repository access (currently 403 "Resource not accessible by integration").
4. **API reachability** — confirm `NEXT_PUBLIC_API_URL` and the API's `CORS_ORIGINS` allow the site origin; otherwise contact form and tap-to-talk sit in their honest "not configured" states.

## 8. Rollback notes

- All platform changes are ten one-line brand edits — revert per file or with a single revert commit.
- `apps/site/` is untracked and purely additive — delete the directory to roll back the site build entirely.
- These docs are additive in `docs/` — remove or keep independently.
- No database migrations, no DNS changes, no production data touched: nothing destructive to unwind.

## 9. Unresolved issues list

1. GitHub App 403 on writes for `Dad-ai` (presumed — sibling repo confirmed) → Jatin must grant repository access before push.
2. Domain `nirmaanco.in` unconfirmed → canonicals/OG/JSON-LD all derive from one env var; confirm before production.
3. Analytics provider undecided; Search Console unverified → measurement baseline is zeros.
4. `pnpm typecheck` / `build` for `@dad-ai/site` not yet run → the §1 verify pass is the single highest-priority action.
5. Real OG images not designed.
6. Enquiry enrichment via `customFields` deferred until the API zod schema allows it; spam protection approach undecided.
7. Screen-reader pass and keyboard walkthrough pending.
8. Byte assets `byte-pfp.webp` / `byte-board.webp` unused (only `byte-pointing.webp` is live); usage beyond hero undecided.
9. Live Vercel/Render deployments of the platform never inspected — no traffic assumptions.

---

Status / last verified: 2026-10-17
