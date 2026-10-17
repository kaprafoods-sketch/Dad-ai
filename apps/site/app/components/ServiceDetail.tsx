import Link from 'next/link';
import Hero from './Hero';
import CTABand from './CTABand';

interface ServiceDetailProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  intro: string;
  who: string;
  problem: string;
  deliverables: string[];
  engagement: string;
  scope: string;
  related?: { href: string; label: string }[];
}

export default function ServiceDetail({
  eyebrow,
  title,
  highlight,
  intro,
  who,
  problem,
  deliverables,
  engagement,
  scope,
  related,
}: ServiceDetailProps) {
  return (
    <>
      <Hero
        eyebrow={eyebrow}
        title={title}
        highlight={highlight}
        subtitle={intro}
        primaryCta={{ label: 'Discuss a Project', href: '/contact' }}
        secondaryCta={{ label: 'All services', href: '/services' }}
      />

      <section className="bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Who it’s for</h2>
              <p className="mt-3 text-base leading-relaxed text-ink/70">{who}</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">The problem it solves</h2>
              <p className="mt-3 text-base leading-relaxed text-ink/70">{problem}</p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-ink">What you get</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {deliverables.map((d) => (
                <li
                  key={d}
                  className="flex gap-3 rounded-2xl border border-ink/10 bg-paper p-4 text-sm leading-relaxed text-ink/75"
                >
                  <span aria-hidden="true" className="mt-0.5 font-bold text-ember">
                    ✓
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">How engagement works</h2>
              <p className="mt-3 text-base leading-relaxed text-ink/70">{engagement}</p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Scope & honesty</h2>
              <p className="mt-3 text-base leading-relaxed text-ink/70">{scope}</p>
            </div>
          </div>

          <div className="mt-12 rounded-3xl bg-ink/[0.03] p-7">
            <h2 className="font-display text-xl font-bold text-ink">Next step</h2>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              Send us an enquiry with a few lines about your situation. We reply with an honest read
              on whether this service fits — and if it doesn’t, we’ll tell you what would fit
              better.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-block rounded-full bg-ember px-7 py-3 text-base font-semibold text-paper transition-opacity hover:opacity-90"
            >
              Discuss a Project
            </Link>
          </div>

          {related && related.length > 0 && (
            <nav aria-label="Related services" className="mt-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-ink/50">Related</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {related.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="inline-block rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ember hover:text-ember"
                    >
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <CTABand />
    </>
  );
}
