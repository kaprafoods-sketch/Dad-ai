import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '../components/Hero';
import CTABand from '../components/CTABand';
import { SERVICES } from '../lib/site-config';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Nirmaanco services: Digital Presence, Digital Growth, and AI & Automation — built on a real working platform, documented in public.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <Hero
        eyebrow="Services"
        title="What we build,"
        highlight="for whom it’s for"
        subtitle="Three services, one operating platform underneath. Every engagement starts with an honest read on fit — if we can't help, we'll say so and point you at what would."
        primaryCta={{ label: 'Discuss a Project', href: '/contact' }}
        secondaryCta={{ label: 'Our approach', href: '/about' }}
      />

      <section aria-labelledby="services-list" className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="services-list" className="sr-only">
            Our services
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group flex flex-col rounded-3xl border border-ink/10 bg-paper p-7 transition-all hover:-translate-y-1 hover:border-ember/40 hover:shadow-xl"
              >
                <h3 className="font-display text-2xl font-bold text-ink group-hover:text-ember">
                  {s.title}
                </h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-ink/65">{s.blurb}</p>
                <span className="mt-6 text-sm font-semibold text-ember">See details →</span>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl rounded-3xl bg-ink/[0.03] p-8 text-center">
            <h3 className="font-display text-xl font-bold text-ink">Not sure which one fits?</h3>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink/65">
              Describe your situation and we’ll tell you which service — if any — is the right
              starting point. No pressure, no jargon.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-ember px-7 py-3 text-base font-semibold text-paper transition-opacity hover:opacity-90"
            >
              Ask us
            </Link>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
