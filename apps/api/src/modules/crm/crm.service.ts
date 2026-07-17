import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorType } from '@dad-ai/shared';
import { PrismaService } from '../../core/prisma.service';

export interface Actor {
  type: ActorType;
  id?: string;
}

/**
 * All CRM writes also write an Activity record — the unified timeline is the
 * audit log for humans AND AI agents (docs/architecture.md §6.2).
 */
@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Contacts ----

  listContacts(tenantId: string, filter: { type?: string; q?: string; take?: number }) {
    const db = this.prisma.tenant(tenantId);
    return db.contact.findMany({
      where: {
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.q
          ? {
              OR: [
                { name: { contains: filter.q, mode: 'insensitive' } },
                { email: { contains: filter.q, mode: 'insensitive' } },
                { phone: { contains: filter.q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: filter.take ?? 50,
    });
  }

  async getContact(tenantId: string, id: string) {
    const db = this.prisma.tenant(tenantId);
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        deals: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async createContact(
    tenantId: string,
    actor: Actor,
    input: {
      type: string;
      name: string;
      phone?: string | null;
      email?: string | null;
      customFields?: Record<string, unknown>;
      source?: string;
    },
  ) {
    const db = this.prisma.tenant(tenantId);
    const contact = await db.contact.create({
      data: {
        tenantId,
        type: input.type,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        customFields: (input.customFields ?? {}) as object,
      },
    });
    await this.logActivity(tenantId, actor, {
      contactId: contact.id,
      type: 'event',
      payload: { event: 'contact.created', contactType: input.type, source: input.source },
    });
    return contact;
  }

  async updateContact(
    tenantId: string,
    actor: Actor,
    id: string,
    input: Partial<{
      name: string;
      phone: string | null;
      email: string | null;
      customFields: Record<string, unknown>;
      type: string;
    }>,
  ) {
    const db = this.prisma.tenant(tenantId);
    const contact = await db.contact.update({
      where: { id },
      data: { ...input, customFields: input.customFields as object | undefined },
    });
    await this.logActivity(tenantId, actor, {
      contactId: id,
      type: 'event',
      payload: { event: 'contact.updated', fields: Object.keys(input) },
    });
    return contact;
  }

  // ---- Pipelines & deals ----

  listPipelines(tenantId: string) {
    return this.prisma.tenant(tenantId).pipeline.findMany({
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  listDeals(tenantId: string, filter: { pipelineId?: string; status?: string }) {
    return this.prisma.tenant(tenantId).deal.findMany({
      where: {
        ...(filter.pipelineId ? { pipelineId: filter.pipelineId } : {}),
        ...(filter.status ? { status: filter.status as never } : {}),
      },
      include: { contact: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createDeal(
    tenantId: string,
    actor: Actor,
    input: {
      contactId: string;
      pipelineId: string;
      stageId?: string;
      title: string;
      value?: number;
      customFields?: Record<string, unknown>;
    },
  ) {
    const db = this.prisma.tenant(tenantId);
    let stageId = input.stageId;
    if (!stageId) {
      const firstStage = await db.stage.findFirst({
        where: { pipelineId: input.pipelineId },
        orderBy: { order: 'asc' },
      });
      if (!firstStage) throw new NotFoundException('Pipeline has no stages');
      stageId = firstStage.id;
    }
    const deal = await db.deal.create({
      data: {
        tenantId,
        contactId: input.contactId,
        pipelineId: input.pipelineId,
        stageId,
        title: input.title,
        value: input.value ?? 0,
        customFields: (input.customFields ?? {}) as object,
      },
    });
    await this.logActivity(tenantId, actor, {
      contactId: input.contactId,
      dealId: deal.id,
      type: 'event',
      payload: { event: 'deal.created', title: input.title },
    });
    return deal;
  }

  async moveDealStage(tenantId: string, actor: Actor, dealId: string, stageId: string) {
    const db = this.prisma.tenant(tenantId);
    const deal = await db.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');
    const stage = await db.stage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException('Stage not found');

    const updated = await db.deal.update({ where: { id: dealId }, data: { stageId } });
    await this.logActivity(tenantId, actor, {
      contactId: deal.contactId,
      dealId,
      type: 'event',
      // deal.stage_changed is a platform event — workflow dispatch hooks in here.
      payload: { event: 'deal.stage_changed', from: deal.stageId, to: stageId },
    });
    return updated;
  }

  async updateDeal(
    tenantId: string,
    actor: Actor,
    dealId: string,
    input: Partial<{ title: string; value: number; status: 'OPEN' | 'WON' | 'LOST' }>,
  ) {
    const db = this.prisma.tenant(tenantId);
    const deal = await db.deal.update({ where: { id: dealId }, data: input });
    await this.logActivity(tenantId, actor, {
      contactId: deal.contactId,
      dealId,
      type: 'event',
      payload: { event: 'deal.updated', fields: Object.keys(input) },
    });
    return deal;
  }

  // ---- Tasks ----

  listTasks(tenantId: string, filter: { status?: string }) {
    return this.prisma.tenant(tenantId).task.findMany({
      where: filter.status ? { status: filter.status as never } : {},
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createTask(
    tenantId: string,
    actor: Actor,
    input: {
      title: string;
      assigneeId?: string;
      dueAt?: Date;
      linkedTo?: { entity: string; id: string };
    },
  ) {
    const db = this.prisma.tenant(tenantId);
    const task = await db.task.create({
      data: {
        tenantId,
        title: input.title,
        assigneeId: input.assigneeId ?? null,
        dueAt: input.dueAt ?? null,
        linkedTo: input.linkedTo ?? undefined,
      },
    });
    await this.logActivity(tenantId, actor, {
      type: 'task',
      payload: { event: 'task.created', taskId: task.id, title: input.title },
    });
    return task;
  }

  updateTaskStatus(
    tenantId: string,
    id: string,
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
  ) {
    return this.prisma.tenant(tenantId).task.update({ where: { id }, data: { status } });
  }

  // ---- Timeline ----

  timeline(tenantId: string, contactId: string) {
    return this.prisma.tenant(tenantId).activity.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async addNote(tenantId: string, actor: Actor, contactId: string, note: string) {
    return this.logActivity(tenantId, actor, {
      contactId,
      type: 'note',
      payload: { note },
    });
  }

  logActivity(
    tenantId: string,
    actor: Actor,
    entry: { contactId?: string; dealId?: string; type: string; payload: Record<string, unknown> },
  ) {
    return this.prisma.tenant(tenantId).activity.create({
      data: {
        tenantId,
        contactId: entry.contactId ?? null,
        dealId: entry.dealId ?? null,
        type: entry.type,
        payload: entry.payload as object,
        actorType: actor.type,
        actorId: actor.id ?? null,
      },
    });
  }
}
