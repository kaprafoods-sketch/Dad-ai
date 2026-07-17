'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Contact } from '../../../lib/api';

export default function CrmPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const contacts = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api<Contact[]>('/crm/contacts'),
    retry: false,
  });

  const createContact = useMutation({
    mutationFn: () =>
      api<Contact>('/crm/contacts', {
        method: 'POST',
        json: { type: 'lead', name, email: email || undefined },
      }),
    onSuccess: () => {
      setName('');
      setEmail('');
      void qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Contacts</h1>

      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createContact.mutate();
        }}
      >
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={createContact.isPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {createContact.isPending ? 'Adding…' : 'Add lead'}
        </button>
      </form>

      {contacts.error && (
        <p className="mt-4 text-sm text-amber-600">API not reachable. See docs/MANUAL_SETUP.md.</p>
      )}

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Phone</th>
          </tr>
        </thead>
        <tbody>
          {contacts.data?.map((c) => (
            <tr key={c.id} className="border-b border-zinc-100">
              <td className="py-2">{c.name}</td>
              <td className="py-2 text-zinc-500">{c.type}</td>
              <td className="py-2 text-zinc-500">{c.email ?? '—'}</td>
              <td className="py-2 text-zinc-500">{c.phone ?? '—'}</td>
            </tr>
          ))}
          {contacts.data?.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-zinc-400">
                No contacts yet — add your first lead above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
