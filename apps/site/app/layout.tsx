import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Montserrat, Inter } from 'next/font/google';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { ORGANIZATION_JSON_LD, SITE_URL, WEBSITE_JSON_LD } from './lib/site-config';
import './globals.css';

const display = Montserrat({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Nirmaanco — Build Smarter. Grow Faster.',
    template: '%s | Nirmaanco',
  },
  description:
    'Nirmaanco helps businesses build digital presence, run digital growth systems, and put AI automation to work — tested and built in public. AI tools, practical tech, and AI for business.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Nirmaanco',
    title: 'Nirmaanco — Build Smarter. Grow Faster.',
    description:
      'Digital presence, digital growth, and AI automation — tested and built in public.',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nirmaanco — Build Smarter. Grow Faster.',
    description:
      'Digital presence, digital growth, and AI automation — tested and built in public.',
  },
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ember focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
