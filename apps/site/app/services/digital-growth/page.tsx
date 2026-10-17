import type { Metadata } from 'next';
import ServiceDetail from '../../components/ServiceDetail';

export const metadata: Metadata = {
  title: 'Digital Growth',
  description:
    'Nirmaanco builds content systems and lead workflows that turn attention into enquiries — and keep every lead organised.',
  alternates: { canonical: '/services/digital-growth' },
};

export default function DigitalGrowthPage() {
  return (
    <ServiceDetail
      eyebrow="Service · Digital Growth"
      title="Attention is cheap."
      highlight="Pipeline isn’t."
      intro="Content systems and lead workflows that turn attention into enquiries — and make sure no enquiry falls through the cracks."
      who="Businesses that already have some presence — a website, a social account, some footfall — but growth depends on the owner remembering to post, follow up, and reply."
      problem="Posting randomly doesn’t compound. Enquiries arrive on WhatsApp, Instagram DMs, and phone calls, and half of them get lost because there’s no system: no follow-up sequence, no record of who asked what, no idea which channel actually works."
      deliverables={[
        'A content system: formats, cadence, and a repeatable production workflow for your niche',
        'Lead capture wired into a real CRM — every enquiry logged with source and stage',
        'Follow-up workflows: reminders, nurture sequences, and escalation rules',
        'Channel setup: WhatsApp Business, Instagram comment-to-DM flows, and landing pages where needed',
        'A simple reporting view: where enquiries come from and what stage they’re at',
      ]}
      engagement="We audit how enquiries currently reach you, then design the smallest system that fixes the biggest leak. We implement it on our platform (or alongside your existing tools), train your team on the daily workflow, and review the pipeline with you after the first few weeks."
      scope="Growth systems improve your odds; they don’t print revenue. We won’t promise followers, virality, or sales figures. What we will do: build a pipeline you can see, measure, and operate — and keep improving the parts that leak."
      related={[
        { href: '/services/digital-presence', label: 'Digital Presence' },
        { href: '/services/ai-automation', label: 'AI & Automation' },
      ]}
    />
  );
}
