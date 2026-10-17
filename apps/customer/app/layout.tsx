import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '../lib/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nirmaanco',
  description:
    'Nirmaanco — Build Smarter. Grow Faster. The AI Business Operating System for your company',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
