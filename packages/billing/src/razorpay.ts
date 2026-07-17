import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Razorpay webhook signature verification (docs/architecture.md §13).
 * Razorpay signs the raw request body with your webhook secret (HMAC-SHA256).
 * Always verify against the RAW body bytes, before JSON parsing.
 */
export function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type RazorpayEventType =
  | 'subscription.activated'
  | 'subscription.charged'
  | 'subscription.halted'
  | 'subscription.cancelled'
  | 'payment.captured'
  | 'payment.failed';

export interface NormalizedBillingEvent {
  type: RazorpayEventType;
  providerId: string; // subscription or payment id
  status: 'active' | 'past_due' | 'cancelled';
  raw: unknown;
}

const STATUS_MAP: Record<RazorpayEventType, NormalizedBillingEvent['status']> = {
  'subscription.activated': 'active',
  'subscription.charged': 'active',
  'payment.captured': 'active',
  'subscription.halted': 'past_due',
  'payment.failed': 'past_due',
  'subscription.cancelled': 'cancelled',
};

/** Normalize a verified Razorpay webhook into an internal billing event. */
export function normalizeRazorpayEvent(payload: {
  event: string;
  payload?: Record<string, unknown>;
}): NormalizedBillingEvent | null {
  const type = payload.event as RazorpayEventType;
  if (!(type in STATUS_MAP)) return null;
  const sub = (payload.payload?.subscription as { entity?: { id?: string } })?.entity;
  const pay = (payload.payload?.payment as { entity?: { id?: string } })?.entity;
  return {
    type,
    providerId: sub?.id ?? pay?.id ?? 'unknown',
    status: STATUS_MAP[type],
    raw: payload,
  };
}
