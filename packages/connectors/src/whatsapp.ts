import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * WhatsApp Cloud API (Meta). Build order #1 connector (docs/architecture.md §8).
 * This module is transport-only: verify + parse inbound webhooks, send outbound
 * messages. Routing an inbound message to the receptionist happens in the
 * worker's agent.run processor.
 */

export interface InboundWhatsAppMessage {
  from: string; // sender phone (E.164, no +)
  text: string;
  messageId: string;
  timestamp: string;
  contactName?: string;
}

/**
 * Meta webhook subscription handshake (GET). Returns the challenge to echo when
 * the verify token matches, else null.
 */
export function verifyWhatsAppSubscription(
  query: { 'hub.mode'?: string; 'hub.verify_token'?: string; 'hub.challenge'?: string },
  verifyToken: string,
): string | null {
  if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === verifyToken) {
    return query['hub.challenge'] ?? '';
  }
  return null;
}

/**
 * Verify the X-Hub-Signature-256 header over the RAW body (HMAC-SHA256 with the
 * Meta app secret). Header format: "sha256=<hex>".
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader.slice('sha256='.length));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Extract text messages from a Meta webhook payload (ignores statuses/other types). */
export function parseWhatsAppInbound(payload: unknown): InboundWhatsAppMessage[] {
  const messages: InboundWhatsAppMessage[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry ?? [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? [];
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value ?? {};
      const contacts =
        (value.contacts as Array<{ profile?: { name?: string }; wa_id?: string }>) ?? [];
      const nameByWaId = new Map(contacts.map((c) => [c.wa_id, c.profile?.name]));
      const msgs =
        (value.messages as Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>) ?? [];
      for (const m of msgs) {
        if (m.type === 'text' && m.text) {
          messages.push({
            from: m.from,
            text: m.text.body,
            messageId: m.id,
            timestamp: m.timestamp,
            contactName: nameByWaId.get(m.from),
          });
        }
      }
    }
  }
  return messages;
}

export interface WhatsAppSendConfig {
  phoneNumberId: string;
  accessToken: string;
  baseUrl?: string;
}

/** Send a text message via the Cloud API. */
export async function sendWhatsAppText(
  config: WhatsAppSendConfig,
  to: string,
  body: string,
): Promise<{ messageId: string }> {
  const url = `${config.baseUrl ?? 'https://graph.facebook.com/v21.0'}/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp send ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  return { messageId: data.messages?.[0]?.id ?? 'unknown' };
}
