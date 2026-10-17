import type { Metadata } from 'next';
import ServiceDetail from '../../components/ServiceDetail';

export const metadata: Metadata = {
  title: 'AI & Automation',
  description:
    'Nirmaanco builds AI receptionist, document AI, and workflow automation on its own working platform — demoed live, roadmap stated honestly.',
  alternates: { canonical: '/services/ai-automation' },
};

export default function AiAutomationPage() {
  return (
    <ServiceDetail
      eyebrow="Service · AI & Automation"
      title="Automate the repetitive."
      highlight="Keep the human."
      intro="AI receptionist, document intelligence, and workflow automation — built on our own working platform, demoed live before you commit."
      who="Businesses drowning in repetitive operational work: answering the same enquiries, keying data from documents, chasing follow-ups, or copying information between tools."
      problem="Your team spends hours on work a machine could draft and a human could approve: replying to routine questions, extracting details from invoices and forms, updating records, sending reminders. Off-the-shelf chatbots sound good in demos and fail on your real data — because they were never connected to it."
      deliverables={[
        'AI Receptionist: an agent that answers enquiries over webchat, WhatsApp, and email — trained on your documents, escalating to a human when it should',
        'Document AI: upload invoices, forms, resumes, or SOPs and get structured data, summaries, and a searchable knowledge base',
        'Workflow automation on self-hosted n8n: lead follow-ups, notifications, and business logic wired to your tools',
        'CRM as the source of truth: every automated touch logged on the contact timeline',
        'Human-in-the-loop design: approval steps wherever mistakes would cost money or trust',
      ]}
      engagement="We map one painful workflow first — the one costing the most hours. We prototype it against your real data, demo it to you (including the tap-to-talk demo on this site), and only then scope a rollout. Automation ships with guardrails, logging, and an owner on your side."
      scope="We demo what’s working today and name what’s roadmap. AI voice calling (Twilio → speech → agent → speech) is a Phase 2 roadmap item on our platform — we can show you the architecture and a web-voice demo, but we will not sell it as shipped telephony. Likewise: no claims about hours saved or accuracy until we’ve measured them on your workflow."
      related={[
        { href: '/services/digital-presence', label: 'Digital Presence' },
        { href: '/services/digital-growth', label: 'Digital Growth' },
      ]}
    />
  );
}
