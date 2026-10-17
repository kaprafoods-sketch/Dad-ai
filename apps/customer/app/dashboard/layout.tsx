'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { api, type TenantMe } from '../../lib/api';

// Pack-driven shell: nav labels and terminology come from the tenant's
// settings.pack.ui (seeded by ApplyIndustryPack). The frontend is generic.
const DEFAULT_NAV = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'crm', label: 'CRM', href: '/dashboard/crm' },
  { key: 'board', label: 'Pipeline', href: '/dashboard/board' },
  { key: 'inbox', label: 'Inbox', href: '/dashboard/inbox' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: tenant } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api<TenantMe>('/tenants/me'),
    retry: false,
  });

  const packNav = tenant?.settings?.pack?.ui?.nav;
  const navItems = packNav?.length
    ? packNav.map((n) => ({
        ...n,
        href:
          n.key === 'crm'
            ? '/dashboard/crm'
            : n.key === 'dashboard'
              ? '/dashboard'
              : `/dashboard/${n.key}`,
      }))
    : DEFAULT_NAV;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 p-4">
        <p className="mb-1 text-lg font-bold">Nirmaanco</p>
        <p className="mb-6 text-xs text-zinc-500">{tenant?.name ?? 'Loading…'}</p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded px-3 py-2 text-sm ${
                  active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
