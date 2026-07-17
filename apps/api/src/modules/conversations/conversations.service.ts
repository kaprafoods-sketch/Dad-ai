import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  InMemoryPromptRegistry,
  OpenRouterModelRouter,
  runAgent,
  type AgentTool,
} from '@dad-ai/ai';
import { PrismaService } from '../../core/prisma.service';
import { CrmService } from '../crm/crm.service';

/**
 * Webchat channel of the AI Receptionist (docs/architecture.md §6.3).
 * WhatsApp/email land on the same path via channel webhooks + the agent.run
 * queue in Phase 2 — this service is the shared core.
 */
@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
  ) {}

  list(tenantId: string) {
    return this.prisma.tenant(tenantId).conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async messages(tenantId: string, conversationId: string) {
    const conversation = await this.prisma
      .tenant(tenantId)
      .conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.prisma.client.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async webchat(tenantId: string, input: { message: string; conversationId?: string }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENROUTER_API_KEY is not configured — the AI receptionist is offline',
      );
    }

    const db = this.prisma.tenant(tenantId);
    const agent = await db.agent.findFirst({ where: { type: 'receptionist', active: true } });
    if (!agent) throw new NotFoundException('No active receptionist agent for this tenant');

    const conversation = input.conversationId
      ? await db.conversation.findUnique({ where: { id: input.conversationId } })
      : await db.conversation.create({
          data: { tenantId, agentId: agent.id, channel: 'webchat' },
        });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.prisma.client.message.create({
      data: { conversationId: conversation.id, role: 'user', content: input.message },
    });

    const history = (
      await this.prisma.client.message.findMany({
        where: { conversationId: conversation.id, role: { in: ['user', 'assistant'] } },
        orderBy: { createdAt: 'asc' },
        take: 30,
      })
    ).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // The agent's stored systemPrompt is its registry entry; tools are limited
    // to its allowlist and every call is logged to the timeline.
    const prompts = new InMemoryPromptRegistry();
    const promptKey = `agent:${agent.id}`;
    prompts.register(promptKey, agent.systemPrompt);
    const router = new OpenRouterModelRouter(prompts, { apiKey });

    const tenant = await this.prisma.client.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const aiActor = { type: 'ai_agent' as const, id: agent.id };
    const allowlist = new Set((agent.tools as string[]) ?? []);
    const tools = this.buildTools(tenantId, aiActor).filter((t) => allowlist.has(t.name));

    const result = await runAgent(router, {
      tenantId,
      promptKey,
      variables: { tenantName: tenant.name },
      tools,
      history,
      onToolCall: async (name, args, output) => {
        await this.crm.logActivity(tenantId, aiActor, {
          type: 'ai_action',
          payload: { tool: name, args, output },
        });
      },
    });

    await this.prisma.client.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: result.reply,
        tokensIn: result.usage.tokensIn,
        tokensOut: result.usage.tokensOut,
        costUsd: result.usage.costUsd,
      },
    });

    // Metering: AiUsage row per exchange (admin AI-cost dashboard reads this).
    await db.aiUsage.create({
      data: {
        tenantId,
        model: agent.model,
        tokensIn: result.usage.tokensIn,
        tokensOut: result.usage.tokensOut,
        costUsd: result.usage.costUsd,
        feature: 'receptionist',
      },
    });

    return { conversationId: conversation.id, reply: result.reply };
  }

  /** Tenant-scoped tool implementations for the receptionist tool catalog. */
  private buildTools(tenantId: string, actor: { type: 'ai_agent'; id: string }): AgentTool[] {
    return [
      {
        name: 'crm.searchContacts',
        description: 'Search CRM contacts by name, email, or phone',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
        execute: async (args) =>
          this.crm.listContacts(tenantId, { q: String(args.query ?? ''), take: 5 }),
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
        execute: async (args) =>
          this.crm.createContact(tenantId, actor, {
            type: 'lead',
            name: String(args.name),
            phone: args.phone ? String(args.phone) : undefined,
            email: args.email ? String(args.email) : undefined,
            customFields: (args.customFields as Record<string, unknown>) ?? {},
            source: 'ai_receptionist',
          }),
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
          this.crm.addNote(tenantId, actor, String(args.contactId), String(args.note)),
      },
      {
        name: 'crm.createTask',
        description: 'Create a follow-up task for the team',
        parameters: {
          type: 'object',
          properties: { title: { type: 'string' } },
          required: ['title'],
        },
        execute: async (args) =>
          this.crm.createTask(tenantId, actor, { title: String(args.title) }),
      },
      {
        name: 'handoff.toHuman',
        description: 'Escalate this conversation to a human team member',
        parameters: { type: 'object', properties: { reason: { type: 'string' } } },
        execute: async (args) => {
          // conversation.needs_human platform event hooks in here (Phase 2).
          await this.crm.logActivity(tenantId, actor, {
            type: 'event',
            payload: { event: 'conversation.needs_human', reason: args.reason },
          });
          return { status: 'escalated' };
        },
      },
    ];
  }
}
