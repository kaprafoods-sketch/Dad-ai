import type { PrismaClient } from '@dad-ai/db';
import { tenantClient } from '@dad-ai/db';
import type { AgentTool } from '@dad-ai/ai';

export interface ActivityLogger {
  (entry: {
    contactId?: string;
    dealId?: string;
    type: string;
    payload: Record<string, unknown>;
  }): Promise<unknown>;
}

/** Writes an Activity attributed to the AI agent (unified timeline). */
export function makeActivityLogger(
  prisma: PrismaClient,
  tenantId: string,
  agentId: string,
): ActivityLogger {
  const db = tenantClient(prisma, tenantId);
  return (entry) =>
    db.activity.create({
      data: {
        tenantId,
        contactId: entry.contactId ?? null,
        dealId: entry.dealId ?? null,
        type: entry.type,
        payload: entry.payload as object,
        actorType: 'ai_agent',
        actorId: agentId,
      },
    });
}

/**
 * The receptionist tool catalog, tenant-scoped. Each tool runs through the
 * tenant client and logs to the timeline via the caller's onToolCall hook.
 * Only the agent's allowlist subset is actually exposed to the model.
 */
export function buildReceptionistTools(
  prisma: PrismaClient,
  tenantId: string,
  log: ActivityLogger,
): AgentTool[] {
  const db = tenantClient(prisma, tenantId);
  return [
    {
      name: 'crm.searchContacts',
      description: 'Search CRM contacts by name, email, or phone',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
      execute: async (args) => {
        const q = String(args.query ?? '');
        return db.contact.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          },
          take: 5,
        });
      },
    },
    {
      name: 'crm.createLead',
      description: 'Create a new lead contact in the CRM',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          customFields: { type: 'object' },
        },
        required: ['name'],
      },
      execute: async (args) => {
        const contact = await db.contact.create({
          data: {
            tenantId,
            type: 'lead',
            name: String(args.name),
            phone: args.phone ? String(args.phone) : null,
            email: args.email ? String(args.email) : null,
            customFields: (args.customFields as object) ?? {},
          },
        });
        await log({
          contactId: contact.id,
          type: 'event',
          payload: { event: 'lead.created', source: 'ai_receptionist' },
        });
        return contact;
      },
    },
    {
      name: 'crm.addNote',
      description: 'Add a note to a contact timeline',
      parameters: {
        type: 'object',
        properties: { contactId: { type: 'string' }, note: { type: 'string' } },
        required: ['contactId', 'note'],
      },
      execute: async (args) =>
        log({
          contactId: String(args.contactId),
          type: 'note',
          payload: { note: String(args.note) },
        }),
    },
    {
      name: 'crm.createTask',
      description: 'Create a follow-up task for the team',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' } },
        required: ['title'],
      },
      execute: async (args) => {
        const task = await db.task.create({
          data: { tenantId, title: String(args.title) },
        });
        await log({ type: 'task', payload: { event: 'task.created', taskId: task.id } });
        return task;
      },
    },
    {
      name: 'handoff.toHuman',
      description: 'Escalate this conversation to a human team member',
      parameters: { type: 'object', properties: { reason: { type: 'string' } } },
      execute: async (args) => {
        await log({
          type: 'event',
          payload: { event: 'conversation.needs_human', reason: args.reason ?? null },
        });
        return { status: 'escalated' };
      },
    },
  ];
}
