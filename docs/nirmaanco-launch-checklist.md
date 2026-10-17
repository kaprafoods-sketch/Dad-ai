# Nirmaanco Launch Checklist

Pre-launch verification for `apps/site`. Each item must be checked against the **built code**, not the plan. Items not yet run are marked **PENDING VERIFICATION**.

## 1. Build & quality

- [ ] **PENDING VERIFICATION** — `pnpm --filter @dad-ai/site typecheck` passes (tsc --noEmit)
- [ ] **PENDING VERIFICATION** — `pnpm --filter @dad-ai/site build` passes (next build)
- [ ] **PENDING VERIFICATION** — repo-level `pnpm lint` (prettier --check) clean for new files
- [ ] **PENDING VERIFICATION** — repo-level CI gates (typecheck, test) unaffected by the additive diff
- [ ] No console errors on any route (manual pass — pending)

## 2. Routes & links

- [ ] **PENDING VERIFICATION** — all 13 content routes return 200: `/`, `/services`, `/services/digital-presence`, `/services/digital-growth`, `/services/ai-automation`, `/knowledge`, `/knowledge/document-ai-pipeline`, `/knowledge/ai-receptionist-webchat`, `/work`, `/about`, `/contact`, `/privacy`, `/terms`
- [ ] **PENDING VERIFICATION** — `/robots.txt` and `/sitemap.xml` serve correctly
- [ ] **PENDING VERIFICATION** — unknown paths render the custom 404 (noindexed)
- [ ] **PENDING VERIFICATION** — no dead links, no dead CTAs, no placeholder buttons (code review says none exist — confirm in browser)
- [ ] **PENDING VERIFICATION** — responsive at mobile, tablet, laptop, wide desktop; no horizontal overflow at common widths

## 3. Forms & CTAs

- [ ] **PENDING VERIFICATION** — Contact form: required-field validation, email regex, inline errors with `aria-invalid`/`role="alert"`, success state on 201/200, error state on API failure
- [ ] **PENDING VERIFICATION** — Contact form with `NEXT_PUBLIC_API_URL` unset: honest "not configured" banner, submission blocked (no fake success)
- [ ] **PENDING VERIFICATION** — Contact form POST body is exactly `{ type: 'lead', name, email }`; `x-tenant-id` only when `NEXT_PUBLIC_DEV_TENANT_ID` set
- [ ] **PENDING VERIFICATION** — Tap-to-talk: idle → listening → sending → speaking transitions; en-IN / hi-IN language switch
- [ ] **PENDING VERIFICATION** — Tap-to-talk degraded states: unsupported browser, mic denied, API unconfigured, API error — each shows the correct notice
- [ ] **PENDING VERIFICATION** — Tap-to-talk copy does not claim phone calls (says "web demo … not a phone call")
- [ ] **PENDING VERIFICATION** — primary CTA "Discuss a Project" → `/contact` works from every page (Hero default, CTABand, nav, footer)

## 4. SEO

- [x] Unique titles, descriptions, canonicals on all 13 routes (verified in code)
- [x] `robots.ts` allows crawling and names the sitemap (verified in code)
- [x] `sitemap.ts` lists all content routes with absolute URLs (verified in code)
- [x] Organization + WebSite JSON-LD present, no fake reviews/ratings (verified in code)
- [x] OG/Twitter defaults + `en_IN` locale, favicon (verified in code)
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
