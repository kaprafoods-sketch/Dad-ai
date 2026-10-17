/**
 * Site-wide configuration for the Nirmaanco public website.
 */

/** PLANNED / UNCONFIRMED domain — update when the real domain is decided */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nirmaanco.in';

/**
 * Base URL of the Dad AI platform API (e.g. https://api.nirmaanco.in/v1…
 * actually: the API root, routes are appended as /v1/…).
 * No localhost default: a missing value means the live API is unconfigured,
 * and interactive components must say so instead of attempting requests.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Tenant header sent only in a dev/preview context, when configured. */
export const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID;

export const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const SERVICES = [
  {
    slug: 'digital-presence',
    title: 'Digital Presence',
    blurb: 'A website and brand presence that explains what you do and makes it easy to reach you.',
  },
  {
    slug: 'digital-growth',
    title: 'Digital Growth',
    blurb: 'Social content systems and lead workflows that keep your pipeline moving.',
  },
  {
    slug: 'ai-automation',
    title: 'AI & Automation',
    blurb:
      'AI receptionist, document AI and workflow automation built on our own working platform.',
  },
] as const;

export const SERVICE_INTEREST_OPTIONS = [
  'Digital Presence',
  'Digital Growth',
  'AI & Automation',
  'Not sure yet',
] as const;

/** JSON-LD: no ratings/reviews — the public profile is new and none exist. */
export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nirmaanco',
  url: SITE_URL,
  description:
    'Nirmaanco builds digital presence, digital growth systems, and AI automation for businesses — and documents what it tests and builds in public.',
  slogan: 'Build Smarter. Grow Faster.',
} as const;

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Nirmaanco',
  url: SITE_URL,
  description:
    'AI tools, practical tech, and AI automation for businesses — tested and built in public.',
} as const;
