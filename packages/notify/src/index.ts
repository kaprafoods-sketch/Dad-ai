import { sendWhatsAppText } from '@dad-ai/connectors';

/**
 * Notification senders for the notify.send queue (docs/architecture.md §12).
 * Each returns a provider message id; all are no-throw-safe about missing
 * config (they raise a clear error the queue can dead-letter).
 */

export type NotifyChannel = 'email' | 'sms' | 'whatsapp';

export interface NotifyRequest {
  channel: NotifyChannel;
  to: string;
  subject?: string; // email only
  body: string;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'noreply@nirmaanco.in'; // planned domain — confirm before production use
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html: body }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function sendSms(to: string, body: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) throw new Error('Twilio env (SID/AUTH/FROM) is not set');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { sid: string };
  return data.sid;
}

export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp env (PHONE_NUMBER_ID/TOKEN) is not set');
  }
  const { messageId } = await sendWhatsAppText({ phoneNumberId, accessToken }, to, body);
  return messageId;
}

export async function notify(req: NotifyRequest): Promise<{ provider: string; id: string }> {
  switch (req.channel) {
    case 'email':
      return { provider: 'resend', id: await sendEmail(req.to, req.subject ?? '', req.body) };
    case 'sms':
      return { provider: 'twilio', id: await sendSms(req.to, req.body) };
    case 'whatsapp':
      return { provider: 'whatsapp', id: await sendWhatsApp(req.to, req.body) };
  }
}
