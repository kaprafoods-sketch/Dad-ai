# Nirmaanco Content Model

How content is structured, published, and connected to services in `apps/site`.

## 1. Content types

| Type               | Route                          | Status                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guide**          | `/knowledge/<slug>`            | Live (2 guides). Static TSX pages under `app/knowledge/<slug>/page.tsx`. Index entry in the hardcoded `GUIDES` array in `app/knowledge/page.tsx`                                                                                                           |
| **Service page**   | `/services/<slug>`             | Live (3). Rendered through the `ServiceDetail` template component (props: eyebrow, title, highlight, intro, who, problem, deliverables[], engagement, scope, related[])                                                                                    |
| **Work entry**     | `/work`                        | **Empty state by design.** The page states that documented experiments and case studies will appear here as completed, and explicitly refuses fabricated logos, metrics, testimonials, or case studies. Do not publish anything here without real evidence |
| **About / policy** | `/about`, `/privacy`, `/terms` | Live. Static pages; privacy/terms marked "Last updated: October 2026"                                                                                                                                                                                      |

Guides are **static TSX — no frontmatter, no MDX, no CMS**. Guide structure (convention, not enforced by schema):

1. `export const metadata` — title, description, canonical
2. `<article>` with eyebrow label ("Guide"), h1, intro paragraph
3. Sections with h2 headings, real steps/settings/outputs
4. A "current limits / what it doesn't do" block (honesty requirement — e.g. Document AI guide documents where the pipeline stops today)
5. Related-service `Link` and/or `CTABand` for the content → enquiry path

## 2. Categories

Per the master prompt's content taxonomy (human-readable, no empty category pages):

1. AI tools and comparisons
2. Creator workflows
3. AI agents and automation
4. AI for business
5. Tutorials and implementation guides
6. Experiments and build logs
7. Case studies and resources

Existing guides map to (5) and (3). Do not create a category landing page until at least 2–3 real guides exist in it.

## 3. Metadata per type

| Type         | Required metadata                                                                          |
| ------------ | ------------------------------------------------------------------------------------------ |
| Guide        | title, unique description, canonical, category, estimated read time (shown on index cards) |
| Service page | title, unique description, canonical                                                       |
| Work entry   | title, description, canonical, date completed, evidence links (when entries exist)         |
| About/policy | title, description, canonical, last-updated date (policies)                                |

All pages inherit the root layout's OG/Twitter defaults, Organization + WebSite JSON-LD, and favicon. Article-level JSON-LD is not yet implemented (add when guides carry real author/date context).

## 4. Publishing workflow (no CMS — by design)

1. Write the guide as `apps/site/app/knowledge/<slug>/page.tsx` following the structure in §1 (original copy, real steps, sources and dates for changing facts, current-limits block).
2. Add one entry to the `GUIDES` array in `app/knowledge/page.tsx` (slug, title, blurb, category, read time).
3. Add internal links: from the guide to the relevant service page(s), and from related guides where applicable.
4. Run `pnpm --filter @dad-ai/site typecheck` and `pnpm --filter @dad-ai/site build` — both must pass.
5. Commit with the guide slug in the message; deploy via the Vercel project.

**Why no CMS:** no CMS exists anywhere in the platform, publishing cadence is low, and every author is technical. A CMS would add auth, hosting, and maintenance cost for zero current benefit. Revisit only if cadence rises or non-technical authors need to publish.

## 5. How content links to services

- **Guides → services:** each guide ends with a related-service link or `CTABand` (e.g. Document AI guide → `/services/ai-automation`).
- **Home → knowledge:** the home page has a knowledge teaser section pulling the guide index, plus the Byte editorial feature linking into the content lane.
- **Services → knowledge:** service pages can link supporting guides as evidence (implementation detail, limits).
- **Navigation:** one compact nav (Services, Knowledge, Work, About, Contact) keeps the media path and the services path connected but distinct. Primary CTA site-wide: **"Discuss a Project"** → `/contact`.

## 6. Editorial rules

- **Original copy only.** No copycat scripts, no fabricated proof: no invented testimonials, client logos, metrics, case studies, prices, or outcomes. The `/work` empty state exists precisely to hold this line.
- **Observed vs estimated:** separate what was actually tested from estimates and opinion; give sources and dates for changing facts (tool pricing, API behavior).
- **Byte series definitions** (editorial identity, not a separate brand):
  - _Byte Finds_ — AI tools Byte has actually tried, with what worked and what didn't
  - _Built with AI_ — real builds broken down step by step (repos, workflows, agents)
  - _AI for Business_ — practical AI automation for real businesses (leads, follow-ups, documents)
  - _Building Nirmaanco_ — documented experiments, decisions, costs, failures, lessons
- **40/25/25/10 allocation is an initial assumption, not a law:** 40% AI discoveries & practical tools, 25% builds & reproducible workflows, 25% business use cases, 10% building Nirmaanco in public. Optimize against retention, shares/saves, qualified visits, and enquiries — not views alone.
- **Keyword-CTAs:** never promise a guide, template, or download in a social CTA unless the resource exists and the delivery flow is ready.

---

Status / last verified: 2026-10-17
