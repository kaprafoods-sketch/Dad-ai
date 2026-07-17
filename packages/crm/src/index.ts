// CRM domain logic. All operations are tenant-scoped by construction and
// emit Activity records so the unified timeline is complete.
// See docs/architecture.md §4 and docs/agency-crm.md.

import type { Activity, Contact, Deal, PlatformEventPayload } from '@dad-ai/shared';

export interface CrmContext {
  tenantId: string;
  actor: { type: 'user' | 'ai_agent' | 'system'; id?: string };
}

export interface CrmService {
  searchContacts(ctx: CrmContext, query: string, type?: string): Promise<Contact[]>;
  createLead(
    ctx: CrmContext,
    input: { name: string; phone?: string; email?: string; source?: string },
  ): Promise<Contact>;
  updateDealStage(ctx: CrmContext, dealId: string, stageId: string): Promise<Deal>;
  addNote(ctx: CrmContext, contactId: string, note: string): Promise<Activity>;
}

/** Moving a deal between stages emits deal.stage_changed for workflows. */
export function dealStageChangedEvent(
  ctx: CrmContext,
  deal: { id: string; stageId: string },
  previousStageId: string,
): PlatformEventPayload<{ dealId: string; from: string; to: string }> {
  return {
    event: 'deal.stage_changed',
    tenantId: ctx.tenantId,
    occurredAt: new Date().toISOString(),
    idempotencyKey: `deal.stage_changed:${deal.id}:${previousStageId}:${deal.stageId}`,
    data: { dealId: deal.id, from: previousStageId, to: deal.stageId },
  };
}

// TODO(phase-1): PrismaCrmService using the tenant-scoped Prisma client wrapper
// (auto-injects where: { tenantId } — raw queries require code review).
