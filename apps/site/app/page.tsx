import Link from 'next/link';
import Hero from './components/Hero';
import CTABand from './components/CTABand';
import ByteFeature from './components/ByteFeature';
import TapToTalk from './components/TapToTalk';

const CAPABILITIES = [
  {
    title: 'Digital Presence',
    href: '/services/digital-presence',
    blurb:
      'Websites, brand assets, and the basics done right — so customers can find you and trust you.',
  },
  {
    title: 'Digital Growth',
    href: '/services/digital-growth',
    blurb:
      'Content systems and lead workflows that turn attention into enquiries — and keep them organised.',
  },
  {
    title: 'AI & Automation',
    href: '/services/ai-automation',
    blurb:
      'AI receptionist, document AI, and workflow automation built on our own working platform.',
  },
];

const PLATFORM_FEATURES = [
  {
    title: 'Universal CRM',
    blurb:
      'Contacts, leads, and deal pipelines in one place, with a timeline of every interaction.',
  },
  {
    title: 'AI Receptionist',
    blurb:
      'An AI agent that answers enquiries over webchat, WhatsApp, and email — escalating to a human when it should.',
  },
  {
    title: 'Document AI & RAG',
    blurb:
      'Upload documents and get structured data, summaries, and a searchable knowledge base backed by vector retrieval.',
  },
  {
    title: 'Workflow automation',
    blurb:
      'Event-driven workflows on self-hosted n8n — lead follow-ups, notifications, and business logic, namespaced per tenant.',
  },
  {
    title: 'Integrations',
    blurb:
      'WhatsApp, email via Resend, voice-ready Twilio plumbing, and Google Workspace connections — voice calling is a Phase 2 roadmap item.',
  },
];

const STEPS = [
  {
    title: 'Discovery',
    blurb:
      'We talk through what you need, what you already have, and whether we’re the right fit. If we can’t help, we’ll say so.',
  },
  {
    title: 'Proposed workflow',
    blurb:
      'You get a clear plan: scope, deliverables, timeline, and what each step costs — before any work starts.',
  },
  {
    title: 'Implementation',
    blurb: 'We build in small, reviewable slices so you can see progress and course-correct early.',
  },
  {
    title: 'Testing & iteration',
    blurb: 'We test with real inputs, fix what breaks, and refine with you until it holds up.',
  },
  {
    title: 'Handover & support',
    blurb: 'You own what we built. We document it, hand it over, and stay available for support.',
  },
];

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="AI solutions & tech media"
        title="Build Smarter."
        highlight="Grow Faster."
        subtitle="Nirmaanco helps small and growing businesses get online, grow their pipeline, and put AI to practical work — and documents everything it tests and builds in public. We don't just talk about AI. We test it, build with it, and show you what actually works."
        primaryCta={{ label: 'Discuss a Project', href: '/contact' }}
        secondaryCta={{ label: 'See how we work', href: '#how-we-work' }}
      />

      <section aria-labelledby="capabilities-heading" className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">What we do</p>
          <h2
            id="capabilities-heading"
            className="mt-3 max-w-2xl text-3xl font-extrabold text-ink sm:text-4xl"
          >
            Three lanes, one goal: systems that work for your business
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-3xl border border-ink/10 bg-paper p-7 transition-all hover:-translate-y-1 hover:border-ember/40 hover:shadow-xl"
              >
                <h3 className="font-display text-xl font-bold text-ink group-hover:text-ember">
                  {c.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-ink/65">{c.blurb}</p>
                <span className="mt-5 inline-block text-sm font-semibold text-ember">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="platform-heading" className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-marigold">
            The working platform behind Nirmaanco
          </p>
          <h2 id="platform-heading" className="mt-3 max-w-3xl text-3xl font-extrabold sm:text-4xl">
            We don’t recommend systems we haven’t built on
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-paper/70">
            Nirmaanco’s services run on a real, working AI business operating platform we develop
            ourselves: multi-tenant, with CRM, AI agents, document intelligence, and workflow
            automation at its core. It’s early-stage and actively being built — which is exactly why
            we can show you how it works instead of making promises about it.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl border border-paper/15 bg-paper/5 p-6">
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-paper/65">{f.blurb}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-paper/50">
            Honest note: this platform is in active development. We describe what it does today — no
            client logos, no metrics, no testimonials, because we don’t have them yet.
          </p>
        </div>
      </section>

      <section id="how-we-work" aria-labelledby="how-heading" className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">Process</p>
          <h2 id="how-heading" className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            How we work
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl bg-ink/[0.03] p-6">
                <span
                  aria-hidden="true"
                  className="font-display text-4xl font-extrabold text-ember/30"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.blurb}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="knowledge-teaser-heading" className="bg-marigold/15">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ember">
              Knowledge hub
            </p>
            <h2 id="knowledge-teaser-heading" className="mt-3 text-3xl font-extrabold text-ink">
              Learn from what we actually build
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink/65">
              Practical guides grounded in the real platform — how the Document AI pipeline works,
              how to set up the AI Receptionist — starting small and growing as we document more.
            </p>
          </div>
          <Link
            href="/knowledge"
            className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-paper transition-transform hover:scale-[1.03]"
          >
            Browse the hub
          </Link>
        </div>
      </section>

      <ByteFeature />

      <section aria-labelledby="demo-heading" className="bg-ink text-paper">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-marigold">
            Try it
          </p>
          <h2 id="demo-heading" className="mt-3 text-center text-3xl font-extrabold sm:text-4xl">
            Talk to our AI Receptionist
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-paper/65">
            The same agent technology we deploy for clients. Tap the mic, ask a question in English
            or Hindi, and hear it answer.
          </p>
          <div className="mt-8">
            <TapToTalk />
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
