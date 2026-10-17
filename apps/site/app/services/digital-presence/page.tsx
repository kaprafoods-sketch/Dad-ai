import type { Metadata } from 'next';
import ServiceDetail from '../../components/ServiceDetail';

export const metadata: Metadata = {
  title: 'Digital Presence',
  description:
    'Nirmaanco builds websites and brand presence that explain what you do and make it easy to reach you.',
  alternates: { canonical: '/services/digital-presence' },
};

export default function DigitalPresencePage() {
  return (
    <ServiceDetail
      eyebrow="Service · Digital Presence"
      title="Get found."
      highlight="Get trusted."
      intro="A website and brand presence that explains what you do, shows proof of your work, and makes it easy for customers to reach you."
      who="Small and growing businesses — traders, service providers, clinics, consultancies — that currently run on word-of-mouth, WhatsApp, or a half-finished website."
      problem="Customers search before they call. If they can’t find you, or what they find looks unfinished, you lose the enquiry before it starts. Most small businesses know they need a proper online presence but don’t know where to start — or got burned by a site that was never finished or never updated."
      deliverables={[
        'A fast, mobile-first website with clear pages: what you do, proof, pricing/contact',
        'Brand basics: wordmark treatment, colour usage, and consistent visual language',
        'Contact and enquiry flows that feed into a CRM — not a dead form',
        'Search basics: metadata, sitemap, and business-profile setup guidance',
        'Handover docs so you (or anyone) can update the site later',
      ]}
      engagement="We start with a discovery call to map your offerings and customers. Then a proposed sitemap and design direction for your approval, followed by the build in reviewable slices, and a testing pass before launch. You approve every milestone."
      scope="We build presence, not guarantees. We won’t promise rankings, traffic numbers, or enquiry volumes — those depend on your market and effort beyond the site. What we do promise: a site that loads fast, reads clearly, and gives every visitor an easy next step."
      related={[
        { href: '/services/digital-growth', label: 'Digital Growth' },
        { href: '/services/ai-automation', label: 'AI & Automation' },
      ]}
    />
  );
}
