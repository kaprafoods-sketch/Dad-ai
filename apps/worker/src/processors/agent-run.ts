import type { PrismaClient } from '@dad-ai/db';
import { handleInboundMessage } from '@dad-ai/receptionist';
import { sendWhatsAppText } from '@dad-ai/connectors';

export interface AgentRunJob {
  tenantId?: string;
  channel: 'whatsapp' | 'email' | 'webchat';
  from: string; // sender phone/email
  contactName?: string;
  message: string;
  phoneNumberId?: string;
}

/**
 * agent.run queue: an inbound channel message → receptionist → reply on the
 * same channel (docs/architecture.md §6.3). Webchat replies synchronously via
 * the API instead, so this handles WhatsApp/email.
 */
export async function processAgentRun(prisma: PrismaClient, job: AgentRunJob): Promise<void> {
  if (!job.tenantId) {
    console.warn('[agent.run] no tenant resolved for inbound message; dropping');
    return;
  }

  const result = await handleInboundMessage(prisma, {
    tenantId: job.tenantId,
    channel: job.channel,
    message: job.message,
    contact:
      job.channel === 'whatsapp'
        ? { phone: job.from, name: job.contactName }
        : { email: job.from, name: job.contactName },
  });

  if (job.channel === 'whatsapp') {
    const phoneNumberId = job.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    if (phoneNumberId && accessToken) {
      await sendWhatsAppText({ phoneNumberId, accessToken }, job.from, result.reply);
    } else {
      console.warn('[agent.run] WhatsApp credentials missing — reply not sent');
    }
  }
}
