import type { Metadata } from 'next';
import Link from 'next/link';
import Hero from '../components/Hero';
import ContactForm from '../components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Send Nirmaanco an enquiry about a project. Clear next steps, no pressure — we reply with an honest read on fit.',
  alternates: { canonical: '/contact' },
};

const STEPS = [
  [
    '1. You send an enquiry',
    'A few lines about your business and what you’re trying to fix or build. The more specific, the better our reply.',
  ],
  [
    '2. We read it properly',
    'A human reviews your enquiry — not an auto-responder. We check whether we can genuinely help.',
  ],
  [
    '3. You get an honest reply',
    'Either a proposed next step (usually a discovery call), or a straight “this isn’t our lane” with what we’d suggest instead.',
  ],
];

export default function ContactPage() {
  return (
    <>
      <Hero
        eyebrow="Contact"
        title="Tell us what you’re"
        highlight="trying to build."
        subtitle="No sales theatre. Send an enquiry, get an honest read on whether we can help — and what it would take."
        primaryCta={{ label: 'Back to home', href: '/' }}
        secondaryCta={{ label: 'Our services', href: '/services' }}
      />

      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">Send an enquiry</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Fields marked * are required. By submitting, you agree to our{' '}
              <Link href="/privacy" className="underline hover:text-ember">
                privacy policy
              </Link>
              .
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">What happens next</h2>
            <ol className="mt-6 space-y-5">
              {STEPS.map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-ink/10 bg-paper p-5">
                  <p className="font-display text-base font-bold text-ink">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-2xl bg-ink/[0.03] p-5">
              <p className="text-sm font-semibold text-ink">Response process — stated plainly</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                We aim to reply to every enquiry personally. We don’t promise a response-time SLA on
                this site, and we don’t use your details for anything other than responding to your
                enquiry. See the privacy policy for exactly what we collect and why.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
