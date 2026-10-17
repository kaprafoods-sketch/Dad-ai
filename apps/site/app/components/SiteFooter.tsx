import Link from 'next/link';
import { NAV } from '../lib/site-config';

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-paper/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight text-paper">
            Nirmaanco<span className="text-ember">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            Digital presence, digital growth, and AI automation — tested and built in public. Build
            Smarter. Grow Faster.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-sm font-semibold uppercase tracking-wider text-paper">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-marigold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-paper">Get in touch</p>
          <p className="mt-4 text-sm leading-relaxed">
            Have a project in mind?{' '}
            <Link href="/contact" className="font-semibold text-marigold hover:underline">
              Send an enquiry
            </Link>{' '}
            and we&apos;ll get back to you.
          </p>
          <ul className="mt-4 flex gap-5 text-sm">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-marigold">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-marigold">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Nirmaanco. All rights reserved.</p>
          <p>Building in public — documentation over claims.</p>
        </div>
      </div>
    </footer>
  );
}
