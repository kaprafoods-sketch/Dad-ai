import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dad AI — Admin',
  description: 'Internal admin panel: tenants, subscriptions, AI costs, system health',
};

// Internal only: deployed separately, behind IP allowlist or admin SSO
// (docs/architecture.md §10).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
