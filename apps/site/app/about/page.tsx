import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '../components/Hero';
import CTABand from '../components/CTABand';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Nirmaanco is an AI solutions agency and tech-media brand: digital presence, digital growth, and AI automation — tested and built in public.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About"
        title="Build Smarter."
        highlight="Grow Faster."
        subtitle="Nirmaanco is an AI solutions agency and a tech-media brand in one. We help businesses get online, grow their pipeline, and put AI to practical work — and we document what we test and build in public."
        primaryCta={{ label: 'Discuss a Project', href: '/contact' }}
        secondaryCta={{ label: 'Our services', href: '/services' }}
      />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="font-display text-2xl font-extrabold text-ink">What Nirmaanco does</h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            Two sides, one standard. On the agency side: digital presence (websites and brand),
            digital growth (content systems and lead workflows), and AI & automation (AI
            receptionist, document AI, and workflow automation) — all built on our own working AI
            business operating platform. On the media side: Byte, our tech-media character, demos AI
            tools and breaks down real builds so the knowledge compounds instead of staying locked
            in client projects.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            The editorial principle is simple:{' '}
            <em>
              “We don&apos;t just talk about AI. We test it, build with it, and show you what
              actually works.”
            </em>{' '}
            If something fails, we document the failure. If a feature is roadmap, we say so.
          </p>

          <h2 className="mt-12 font-display text-2xl font-extrabold text-ink">
            How we approach work
          </h2>
          <ul className="mt-4 space-y-4">
            {[
              [
                'Smallest credible system first',
                'We start with the smallest thing that fixes the biggest leak, then expand what works.',
              ],
              [
                'Your data, your guardrails',
                'AI agents run on your documents and your tools, with human approval wherever mistakes would cost money or trust.',
              ],
              [
                'Demo before commitment',
                'We show working software — including the live voice demo on this site — before asking you to commit.',
              ],
              [
                'You own what we build',
                'Documented handover, no lock-in theatrics. The platform is ours to maintain; your data and workflows are yours.',
              ],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-ink/10 bg-paper p-5">
                <p className="font-display text-base font-bold text-ink">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{d}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 font-display text-2xl font-extrabold text-ink">Brand ownership</h2>
          <p className="mt-4 text-base leading-relaxed text-ink/70">
            Nirmaanco is the master brand for both the agency and the media work. Byte is an
            editorial character within Nirmaanco — Byte presents and demonstrates, but never as a
            competing brand. When you hire Nirmaanco, you work with Nirmaanco.
          </p>

          <div className="mt-10">
            <Link
              href="/work"
              className="inline-block rounded-full border-2 border-ink px-7 py-3 text-base font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              See our work
            </Link>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
