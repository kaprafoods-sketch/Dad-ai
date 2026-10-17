import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you’re looking for doesn’t exist.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center sm:px-6">
        <p aria-hidden="true" className="font-display text-8xl font-extrabold text-ember">
          404
        </p>
        <h1 className="mt-6 text-3xl font-extrabold">This page wandered off.</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-paper/65">
          The page you’re looking for doesn’t exist — or it moved while we were building in public.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-ember px-7 py-3 text-base font-semibold text-paper transition-opacity hover:opacity-90"
          >
            Back to home
          </Link>
          <Link
            href="/services"
            className="rounded-full border border-paper/30 px-7 py-3 text-base font-semibold text-paper transition-colors hover:border-marigold hover:text-marigold"
          >
            See services
          </Link>
        </div>
      </div>
    </section>
  );
}
