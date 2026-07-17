'use client';

import { useQuery } from '@tanstack/react-query';
import { api, type Deal, type Contact } from '../../lib/api';

export default function DashboardPage() {
  const contacts = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api<Contact[]>('/crm/contacts'),
    retry: false,
  });
  const deals = useQuery({
    queryKey: ['deals'],
    queryFn: () => api<Deal[]>('/crm/deals'),
    retry: false,
  });

  const openDeals = deals.data?.filter((d) => d.status === 'OPEN') ?? [];
  const pipelineValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {(contacts.error || deals.error) && (
        <p className="mt-2 text-sm text-amber-600">
          API not reachable yet. Start the API and set NEXT_PUBLIC_DEV_TENANT_ID. See
          docs/MANUAL_SETUP.md.
        </p>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Contacts" value={contacts.data?.length ?? 0} />
        <Stat label="Open deals" value={openDeals.length} />
        <Stat label="Pipeline value" value={`₹${pipelineValue.toLocaleString('en-IN')}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
