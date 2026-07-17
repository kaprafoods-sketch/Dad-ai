import { BadRequestException, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  parseWhatsAppInbound,
  verifyWhatsAppSignature,
  verifyWhatsAppSubscription,
} from '@dad-ai/connectors';
import { QUEUES } from '@dad-ai/shared';
import { Public } from '../../core/public.decorator';
import { PrismaService } from '../../core/prisma.service';
import { QueueService } from '../../core/queue.service';

/**
 * Inbound channel webhooks (docs/architecture.md §6.3). Public routes,
 * authenticated by provider signature — never JWT. Each verified inbound
 * message is enqueued to agent.run so the worker runs the receptionist and
 * replies on the same channel.
 */
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  /** Meta subscription handshake. */
  @Public()
  @Get('whatsapp')
  whatsappVerify(@Query() query: Record<string, string>, @Res() res: Response) {
    const token = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
    const challenge = verifyWhatsAppSubscription(query, token);
    if (challenge === null) {
      res.status(403).send('Forbidden');
      return;
    }
    res.status(200).send(challenge);
  }

  /**
   * Inbound WhatsApp messages. The phone number id in the payload identifies
   * which tenant's WhatsApp connector received it.
   */
  @Public()
  @Post('whatsapp')
  async whatsappInbound(@Req() req: Request & { rawBody?: Buffer }) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const raw = req.rawBody?.toString('utf8');
    const signature = req.header('x-hub-signature-256');
    if (!appSecret || !raw) throw new BadRequestException('Missing app secret or raw body');
    if (!verifyWhatsAppSignature(raw, signature, appSecret)) {
      throw new BadRequestException('Invalid signature');
    }

    const payload = JSON.parse(raw);
    const phoneNumberId = extractPhoneNumberId(payload);
    const messages = parseWhatsAppInbound(payload);

    // Resolve tenant from the receiving phone number id, stored on the
    // WhatsApp ConnectorInstall credentials at setup time.
    const install = phoneNumberId
      ? await this.prisma.client.connectorInstall.findFirst({
          where: { provider: 'whatsapp', status: 'ACTIVE' },
        })
      : null;

    for (const message of messages) {
      await this.queue.enqueue(
        QUEUES.AGENT_RUN,
        {
          tenantId: install?.tenantId,
          channel: 'whatsapp',
          from: message.from,
          contactName: message.contactName,
          message: message.text,
          phoneNumberId,
        },
        message.messageId, // idempotency: Meta may redeliver
      );
    }
    // Always 200 quickly so Meta doesn't retry; work happens in the worker.
    return { received: messages.length };
  }
}

function extractPhoneNumberId(payload: unknown): string | undefined {
  const entry = (payload as { entry?: unknown[] })?.entry?.[0];
  const change = (entry as { changes?: unknown[] })?.changes?.[0];
  const value = (change as { value?: { metadata?: { phone_number_id?: string } } })?.value;
  return value?.metadata?.phone_number_id;
}
