import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '../components/Hero';
import CTABand from '../components/CTABand';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Nirmaanco’s work, documented in public. Case studies and experiments will appear here as they’re completed — nothing fabricated.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <>
      <Hero
        eyebrow="Work"
        title="Building in public."
        subtitle="Documented experiments and case studies will appear here as they’re completed. We don’t publish fabricated case studies, client logos, metrics, or testimonials — when there’s something real to show, it goes here with the evidence."
        primaryCta={{ label: 'Discuss a Project', href: '/contact' }}
        secondaryCta={{ label: 'Read the knowledge hub', href: '/knowledge' }}
      />

      <section aria-labelledby="work-empty" className="bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-3xl border-2 border-dashed border-ink/20 bg-ink/[0.02] p-10 text-center sm:p-14">
            <p className="mx-auto max-w-md text-lg leading-relaxed text-ink/60">
              Nothing published yet — the first documented builds are in progress. In the meantime,
              the{' '}
              <Link href="/knowledge" className="font-semibold text-ember hover:underline">
                knowledge hub
              </Link>{' '}
              shows how the underlying platform works, and the{' '}
              <Link href="/#demo-heading" className="font-semibold text-ember hover:underline">
                live voice demo
              </Link>{' '}
              shows the AI Receptionist in action.
            </p>
          </div>

          <div className="mt-10">
            <h2 id="work-empty" className="font-display text-xl font-bold text-ink">
              What will appear here
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                [
                  'Experiments',
                  'Things we tested — tool comparisons, workflow trials — with what worked and what didn’t.',
                ],
                [
                  'Client builds',
                  'Real engagements, published with the client’s permission, describing scope and outcome honestly.',
                ],
                ['Platform builds', 'Features of our own platform, documented as they ship.'],
              ].map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-ink/10 bg-paper p-5">
                  <p className="font-display text-base font-bold text-ink">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
