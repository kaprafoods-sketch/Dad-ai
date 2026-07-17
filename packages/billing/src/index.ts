// Plans, feature gating, and AI-usage metering. See docs/architecture.md §13.

import type { Plan } from '@dad-ai/shared';

export const FEATURES = [
  'crm',
  'documents',
  'knowledge_base',
  'ai_chat',
  'ai_receptionist',
  'ai_employee',
  'workflows',
  'connectors',
  'voice',
  'api_access',
] as const;
export type Feature = (typeof FEATURES)[number];

/**
 * plan → features map. Checked server-side in a @RequiresFeature() guard and
 * mirrored in the frontend to hide gated UI.
 */
export const PLAN_FEATURES: Record<Plan, readonly Feature[]> = {
  TRIAL: ['crm', 'documents', 'knowledge_base', 'ai_chat'],
  STARTER: ['crm', 'documents', 'knowledge_base', 'ai_chat', 'ai_receptionist', 'connectors'],
  PRO: [
    'crm',
    'documents',
    'knowledge_base',
    'ai_chat',
    'ai_receptionist',
    'ai_employee',
    'workflows',
    'connectors',
  ],
  BUSINESS: [...FEATURES],
};

/** Monthly AI budget (USD) per plan — soft warn at 80%, hard cap at 100%. */
export const PLAN_AI_BUDGET_USD: Record<Plan, number> = {
  TRIAL: 5,
  STARTER: 25,
  PRO: 100,
  BUSINESS: 400,
};

export function planHasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}

export {
  verifyRazorpaySignature,
  normalizeRazorpayEvent,
  type RazorpayEventType,
  type NormalizedBillingEvent,
} from './razorpay';

// TODO(phase-3): Razorpay checkout/subscription creation (outbound API).
// TODO(later): Stripe when going international.
