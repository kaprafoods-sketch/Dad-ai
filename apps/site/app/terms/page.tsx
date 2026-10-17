import type { Metadata } from 'next';
import CTABand from '../components/CTABand';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Nirmaanco’s terms of service: what this site offers and the limits of that offer.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <>
      <article className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">Legal</p>
          <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-ink/50">Last updated: October 2026</p>

          <div className="mt-8 space-y-8 text-base leading-relaxed text-ink/70">
            <section>
              <h2 className="font-display text-lg font-bold text-ink">What this site is</h2>
              <p className="mt-3">
                This website describes Nirmaanco’s services, documents how our platform works, and
                provides a contact form for project enquiries. Content here — including guides and
                demos — is provided for information, and guides are updated when the underlying
                systems change.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">No guaranteed outcomes</h2>
              <p className="mt-3">
                Nothing on this site guarantees revenue, rankings, traffic, followers, or automation
                results. Service outcomes are agreed in writing per engagement, based on the scope
                we propose after discovery.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">Demos</h2>
              <p className="mt-3">
                The tap-to-talk demo on this site is a live demonstration of the AI Receptionist
                over the web, dependent on your browser’s speech features and our API being
                configured. It is not a phone service and carries no service-level commitment.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">Acceptable use</h2>
              <p className="mt-3">
                Don’t misuse the contact form or demos (spam, abuse, attempts to extract other
                users’ data). We may decline or discontinue responding to misuse.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">Changes</h2>
              <p className="mt-3">
                We may update these terms as the site and services evolve; the “last updated” date
                above reflects the current version.
              </p>
            </section>
          </div>
        </div>
      </article>

      <CTABand />
    </>
  );
}
