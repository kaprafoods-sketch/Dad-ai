'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';

// Live webchat with the tenant's AI Receptionist. Requires OPENROUTER_API_KEY
// on the API and an active receptionist agent (seeded by the pack).
export default function InboxPage() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [log, setLog] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const send = useMutation({
    mutationFn: (message: string) =>
      api<{ conversationId: string; reply: string }>('/conversations/webchat', {
        method: 'POST',
        json: { message, conversationId },
      }),
    onSuccess: (res) => {
      setConversationId(res.conversationId);
      setLog((l) => [...l, { role: 'assistant', content: res.reply }]);
    },
    onError: (err) => {
      setLog((l) => [...l, { role: 'assistant', content: `⚠️ ${(err as Error).message}` }]);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;
    setLog((l) => [...l, { role: 'user', content: message }]);
    setInput('');
    send.mutate(message);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Inbox — AI Receptionist</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Test the receptionist here. The same agent handles WhatsApp and email in Phase 2.
      </p>

      <div className="mt-6 flex h-96 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 p-4">
        {log.length === 0 && (
          <p className="text-sm text-zinc-400">Say hello to start a conversation.</p>
        )}
        {log.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'self-end bg-zinc-900 text-white'
                : 'self-start bg-zinc-100 text-zinc-900'
            }`}
          >
            {m.content}
          </div>
        ))}
        {send.isPending && <p className="self-start text-sm text-zinc-400">typing…</p>}
      </div>

      <form className="mt-3 flex gap-2" onSubmit={submit}>
        <input
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={send.isPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
