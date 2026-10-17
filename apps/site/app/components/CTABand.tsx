import Link from 'next/link';

interface CTABandProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}

export default function CTABand({
  title = 'Have something to build or automate?',
  subtitle = 'Tell us about your project — we reply with a clear read on whether we can help, and what it would take.',
  ctaLabel = 'Discuss a Project',
}: CTABandProps) {
  return (
    <section className="bg-ember">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-paper sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-paper/85">{subtitle}</p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 rounded-full bg-ink px-8 py-4 text-base font-semibold text-paper transition-transform hover:scale-[1.03]"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
