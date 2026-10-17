import type { Metadata } from 'next';
import CTABand from '../components/CTABand';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Nirmaanco’s privacy policy: what we collect from the contact form and how it’s used.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <>
      <article className="bg-paper">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-ember">Legal</p>
          <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-ink/50">Last updated: October 2026</p>

          <div className="mt-8 space-y-8 text-base leading-relaxed text-ink/70">
            <section>
              <h2 className="font-display text-lg font-bold text-ink">What we collect</h2>
              <p className="mt-3">
                When you submit the contact form on this site, we collect the details you enter:
                your name, email address, and anything you choose to add (business, website, service
                interest, your message, budget/timeline). We collect nothing else from you on this
                site — no account data, no payment data.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">How it’s used</h2>
              <p className="mt-3">
                Your enquiry is submitted to our CRM (a lead record on the Dad AI platform) so we
                can read it and reply to you. We use your details only to respond to your enquiry
                and discuss your project. We do not sell your data, and we do not add you to
                marketing lists — you contacted us; we reply.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">Analytics</h2>
              <p className="mt-3">
                Analytics are not yet configured on this site. We do not run tracking pixels, ad
                retargeting, or third-party analytics at this time. If that changes, this policy
                will be updated first.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">Your rights</h2>
              <p className="mt-3">
                You can ask us to show you, correct, or delete the enquiry data we hold about you.
                Reply to any email from us, or submit a new enquiry asking for deletion, and we will
                act on it.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink">Contact</h2>
              <p className="mt-3">
                For privacy questions, use the{' '}
                <a href="/contact" className="font-semibold text-ember hover:underline">
                  contact form
                </a>{' '}
                and mention “privacy” in your message.
              </p>
            </section>
          </div>
        </div>
      </article>

      <CTABand />
    </>
  );
}
