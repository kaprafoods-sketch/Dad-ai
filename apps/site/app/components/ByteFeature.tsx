import Image from 'next/image';
import Link from 'next/link';

const SERIES = [
  {
    title: 'Byte Finds',
    blurb: 'AI tools Byte has actually tried, with what worked and what didn’t.',
  },
  {
    title: 'Built with AI',
    blurb: 'Real builds broken down step by step — repos, workflows, and AI agents.',
  },
  {
    title: 'AI for Business',
    blurb: 'Practical AI automation for real businesses: leads, follow-ups, documents.',
  },
  {
    title: 'Building Nirmaanco',
    blurb: 'The making of this site and this agency, documented as it happens.',
  },
];

export default function ByteFeature() {
  return (
    <section aria-labelledby="byte-heading" className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative">
            <Image
              src="/byte/byte-pointing.webp"
              alt="Byte, Nirmaanco’s AI tech-media character — a 2D anime boy with spiky blonde hair and a black hoodie — pointing at the viewer"
              width={640}
              height={640}
              className="w-full rounded-3xl object-cover shadow-xl"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ember">Meet Byte</p>
            <h2 id="byte-heading" className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
              Nirmaanco’s AI tech-media character
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              Byte is part of Nirmaanco — not a separate brand. Byte demos tools, breaks down
              builds, and shows what actually works with AI, in short videos and practical
              write-ups.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {SERIES.map((s) => (
                <li key={s.title} className="rounded-2xl border border-ink/10 bg-paper p-4">
                  <p className="font-display text-base font-bold text-ink">{s.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{s.blurb}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/knowledge"
              className="mt-6 inline-block rounded-full border-2 border-ink px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Read the knowledge hub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
