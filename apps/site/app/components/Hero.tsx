import Link from 'next/link';

interface HeroProps {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export default function Hero({
  eyebrow,
  title,
  highlight,
  subtitle,
  primaryCta = { label: 'Discuss a Project', href: '/contact' },
  secondaryCta = { label: 'See how we work', href: '/#how-we-work' },
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-ink text-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-10%] h-96 w-96 rounded-full bg-ember/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-30%] left-[-5%] h-80 w-80 rounded-full bg-marigold/15 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        {eyebrow && (
          <p className="mb-5 inline-block rounded-full border border-paper/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-marigold">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">
          {title} {highlight && <span className="text-ember">{highlight}</span>}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper/75">{subtitle}</p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={primaryCta.href}
            className="rounded-full bg-ember px-7 py-3.5 text-base font-semibold text-paper transition-transform hover:scale-[1.03] hover:opacity-95"
          >
            {primaryCta.label}
          </Link>
          <Link
            href={secondaryCta.href}
            className="rounded-full border border-paper/30 px-7 py-3.5 text-base font-semibold text-paper transition-colors hover:border-marigold hover:text-marigold"
          >
            {secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
