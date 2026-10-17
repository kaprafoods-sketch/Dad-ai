import type { Metadata } from 'next';
import Link from 'next/link';
import CTABand from '../../components/CTABand';

export const metadata: Metadata = {
  title: 'Setting up the AI Receptionist webchat',
  description:
    'How the AI Receptionist webchat endpoint works: the POST /v1/conversations/webchat contract, API requirements, and current limits.',
  alternates: { canonical: '/knowledge/ai-receptionist-webchat' },
};

export default function ReceptionistWebchatGuide() {
  return (
    <>
      <article className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">Guide</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            Setting up the AI Receptionist webchat
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink/65">
            Based on the actual implementation:{' '}
            <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">
              apps/customer/app/dashboard/inbox/page.tsx
            </code>
            ,{' '}
            <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">
              apps/api/src/modules/conversations
            </code>
            , and{' '}
            <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">packages/receptionist</code>.
          </p>

          <section aria-labelledby="q" className="mt-10">
            <h2 id="q" className="font-display text-xl font-bold text-ink">
              The question this answers
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink/70">
              You want an AI agent answering enquiries on your website. What does the platform
              actually need to make that work, what does the API contract look like, and what are
              the honest limits of the demo on this site?
            </p>
          </section>

          <section aria-labelledby="contract" className="mt-10">
            <h2 id="contract" className="font-display text-xl font-bold text-ink">
              The endpoint contract
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-ink p-5 text-sm leading-relaxed">
              <pre className="text-paper/85">
                {`POST /v1/conversations/webchat
Content-Type: application/json

{ "message": "Do you deliver on weekends?",
  "conversationId": "<uuid, optional>" }

→ 200 { "conversationId": "<uuid>",
        "reply": "Yes — …" }`}
              </pre>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink/70">
              <li>
                <strong>message</strong> — required, 1–4000 characters (validated by zod on the
                API).
              </li>
              <li>
                <strong>conversationId</strong> — optional UUID; pass it back to continue a
                conversation, omit it to start one.
              </li>
              <li>
                The reply comes from the tenant’s AI receptionist agent, running with tenant-scoped
                CRM tools, usage metering, and a needs-human escalation flag.
              </li>
            </ul>
          </section>

          <section aria-labelledby="steps" className="mt-10">
            <h2 id="steps" className="font-display text-xl font-bold text-ink">
              What the API needs
            </h2>
            <ol className="mt-4 space-y-5">
              {[
                [
                  'OPENROUTER_API_KEY on the API',
                  'The receptionist calls the model router through OpenRouter. Without the key, every request fails with a clear configuration error — the endpoint never pretends to work.',
                ],
                [
                  'A seeded receptionist agent',
                  'The tenant needs an active receptionist agent, seeded by the tenant’s industry pack (prompts, tools, escalation rules). No agent, no replies.',
                ],
                [
                  'A tenant context',
                  'Every request runs under a tenant ID, so the agent only ever sees that tenant’s contacts, conversations, and documents.',
                ],
                [
                  'Embed the demo',
                  'With those in place, the tap-to-talk demo on this site — or the text chat in the customer dashboard inbox — talks to the same agent your customers would meet.',
                ],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/10 font-display text-sm font-bold text-ember"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/65">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="limits" className="mt-10">
            <h2 id="limits" className="font-display text-xl font-bold text-ink">
              Current limitations
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/70">
              <li className="rounded-xl bg-marigold/10 px-4 py-3">
                <strong>The demo on this site is a web demo, not telephony.</strong> Tap-to-talk
                uses your browser’s speech recognition and synthesis to talk to the webchat
                endpoint. AI voice calling (Twilio → streaming speech-to-text → agent →
                text-to-speech) is a Phase 2 roadmap item in the platform architecture — we will not
                present the demo as shipped phone calling.
              </li>
              <li className="rounded-xl bg-marigold/10 px-4 py-3">
                <strong>Quality depends on the agent’s setup.</strong> A receptionist with a good
                prompt, the right tools, and your documents uploaded answers well; a bare seeded
                agent answers generically. Setup is the work — see the AI & Automation service.
              </li>
              <li className="rounded-xl bg-marigold/10 px-4 py-3">
                <strong>WhatsApp and email are the same agent, later channels.</strong> The shared
                orchestration already handles inbound WhatsApp/email through the worker queue, but
                the public launch starts with WhatsApp + email + webchat.
              </li>
            </ul>
          </section>

          <section aria-labelledby="related" className="mt-10">
            <h2 id="related" className="font-display text-xl font-bold text-ink">
              Related services
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/services/ai-automation"
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ember hover:text-ember"
              >
                AI & Automation
              </Link>
              <Link
                href="/services/digital-presence"
                className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ember hover:text-ember"
              >
                Digital Presence
              </Link>
            </div>
          </section>
        </div>
      </article>

      <CTABand />
    </>
  );
}
