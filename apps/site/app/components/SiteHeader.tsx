'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '../lib/site-config';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-xl font-extrabold tracking-tight text-ink"
          aria-label="Nirmaanco home"
        >
          Nirmaanco<span className="text-ember">.</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`text-sm font-medium transition-colors hover:text-ember ${
                pathname === item.href ? 'text-ember' : 'text-ink/80'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
          >
            Discuss a Project
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-ink/10 bg-paper px-4 pb-5 pt-2 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2.5 text-base font-medium hover:bg-ink/5 ${
                    pathname === item.href ? 'text-ember' : 'text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-ember px-5 py-3 text-center text-base font-semibold text-paper"
              >
                Discuss a Project
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
