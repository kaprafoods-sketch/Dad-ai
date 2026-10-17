import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '../components/Hero';
import CTABand from '../components/CTABand';

export const metadata: Metadata = {
  title: 'Knowledge Hub',
  description:
    'Practical guides grounded in Nirmaanco’s real platform: how the Document AI pipeline works, how to set up the AI Receptionist webchat.',
  alternates: { canonical: '/knowledge' },
};

const GUIDES = [
  {
    slug: 'document-ai-pipeline',
    title: 'How the Document AI pipeline works',
    blurb:
      'Upload → worker processing → chunk and embed (pgvector) → RAG search and summarize. What happens at each step, and where it stops today.',
  },
  {
    slug: 'ai-receptionist-webchat',
    title: 'Setting up the AI Receptionist webchat',
    blurb:
      'The webchat endpoint contract, what the API needs (key + seeded agent), and the limits of what the demo can do.',
  },
];

export default function KnowledgePage() {
  return (
    <>
      <Hero
        eyebrow="Knowledge hub"
        title="A starting library."
        highlight="Growing in public."
        subtitle="Practical guides grounded in the actual platform we build on — not theory. Short, accurate, and updated when the underlying system changes."
        primaryCta={{ label: 'Discuss a Project', href: '/contact' }}
        secondaryCta={{ label: 'All services', href: '/services' }}
      />

      <section aria-labelledby="guides-heading" className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="guides-heading" className="text-3xl font-extrabold text-ink">
            Guides
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                href={`/knowledge/${g.slug}`}
                className="group rounded-3xl border border-ink/10 bg-paper p-7 transition-all hover:-translate-y-1 hover:border-ember/40 hover:shadow-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-ember">Guide</p>
                <h3 className="mt-2 font-display text-xl font-bold text-ink group-hover:text-ember">
                  {g.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-ink/65">{g.blurb}</p>
                <span className="mt-5 inline-block text-sm font-semibold text-ember">Read →</span>
              </Link>
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ink/50">
            Honest note: this library is new. Guides describe the platform as it exists today; when
            a feature changes, the guide changes with it. No fabricated results, screenshots, or
            numbers — only what the code does.
          </p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
