// Platform events. Workflows (n8n) and internal consumers subscribe to these.

export const PLATFORM_EVENTS = [
  'lead.created',
  'deal.stage_changed',
  'document.ready',
  'payment.received',
  'appointment.booked',
  'conversation.needs_human',
] as const;
export type PlatformEvent = (typeof PLATFORM_EVENTS)[number];

export interface PlatformEventPayload<T = unknown> {
  event: PlatformEvent;
  tenantId: string;
  occurredAt: string; // ISO timestamp
  idempotencyKey: string;
  data: T;
}

// BullMQ queue names (consumed by apps/worker).
export const QUEUES = {
  DOC_PROCESS: 'doc.process',
  CONNECTOR_SYNC: 'connector.sync',
  AGENT_RUN: 'agent.run',
  NOTIFY_SEND: 'notify.send',
  WORKFLOW_TRIGGER: 'workflow.trigger',
  BILLING_METER: 'billing.meter',
} as const;
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
