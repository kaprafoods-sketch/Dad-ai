import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { planHasFeature, PLAN_FEATURES } from './index';
import { verifyRazorpaySignature, normalizeRazorpayEvent } from './razorpay';

describe('feature gating', () => {
  it('gates ai_receptionist below STARTER', () => {
    expect(planHasFeature('TRIAL', 'ai_receptionist')).toBe(false);
    expect(planHasFeature('STARTER', 'ai_receptionist')).toBe(true);
  });

  it('BUSINESS unlocks everything', () => {
    expect(PLAN_FEATURES.BUSINESS).toContain('voice');
    expect(PLAN_FEATURES.BUSINESS).toContain('api_access');
  });

  it('TRIAL has core CRM but not workflows', () => {
    expect(planHasFeature('TRIAL', 'crm')).toBe(true);
    expect(planHasFeature('TRIAL', 'workflows')).toBe(false);
  });
});

describe('razorpay signature', () => {
  const secret = 'whsec_test';
  const body = JSON.stringify({ event: 'payment.captured' });
  const sig = createHmac('sha256', secret).update(body).digest('hex');

  it('accepts a valid signature', () => {
    expect(verifyRazorpaySignature(body, sig, secret)).toBe(true);
  });

  it('rejects a tampered body', () => {
    expect(verifyRazorpaySignature(body + 'x', sig, secret)).toBe(false);
  });

  it('rejects a wrong signature without throwing', () => {
    expect(verifyRazorpaySignature(body, 'deadbeef', secret)).toBe(false);
  });
});

describe('normalizeRazorpayEvent', () => {
  it('maps subscription.activated to active', () => {
    const event = normalizeRazorpayEvent({
      event: 'subscription.activated',
      payload: { subscription: { entity: { id: 'sub_1' } } },
    });
    expect(event).toMatchObject({ status: 'active', providerId: 'sub_1' });
  });

  it('maps payment.failed to past_due', () => {
    const event = normalizeRazorpayEvent({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'pay_1' } } },
    });
    expect(event).toMatchObject({ status: 'past_due', providerId: 'pay_1' });
  });

  it('ignores unknown events', () => {
    expect(normalizeRazorpayEvent({ event: 'invoice.paid' })).toBeNull();
  });
});
