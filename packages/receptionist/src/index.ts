import type { PrismaClient } from '@dad-ai/db';
import { tenantClient } from '@dad-ai/db';
import { InMemoryPromptRegistry, OpenRouterModelRouter, runAgent } from '@dad-ai/ai';
import type { Channel } from '@dad-ai/shared';
import { buildReceptionistTools, makeActivityLogger } from './crm-tools';

export { buildReceptionistTools, makeActivityLogger } from './crm-tools';

export interface HandleInboundInput {
  tenantId: string;
  channel: Channel;
  message: string;
  /** Continue an existing conversation… */
  conversationId?: string;
  /** …or match/create a contact for a channel (WhatsApp/email inbound). */
  contact?: { phone?: string; email?: string; name?: string };
}

export interface HandleInboundResult {
  conversationId: string;
  contactId: string | null;
  reply: string;
  needsHuman: boolean;
  usage: { tokensIn: number; tokensOut: number; costUsd: number };
}

export class ReceptionistError extends Error {}

/**
 * Shared receptionist orchestration used by both the API (webchat) and the
 * worker (WhatsApp/email via the agent.run queue). Resolves the contact +
 * conversation, runs the agent loop with tenant-scoped tools, persists
 * messages, meters usage, and records every AI action on the timeline.
 */
export async function handleInboundMessage(
  prisma: PrismaClient,
  input: HandleInboundInput,
): Promise<HandleInboundResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new ReceptionistError('OPENROUTER_API_KEY is not configured');

  const db = tenantClient(prisma, input.tenantId);
  const agent = await db.agent.findFirst({ where: { type: 'receptionist', active: true } });
  if (!agent) throw new ReceptionistError('No active receptionist agent for this tenant');

  // Resolve the contact (for channel inbound) and conversation.
  let contactId: string | null = null;
  if (input.contact?.phone || input.contact?.email) {
    const existing = await db.contact.findFirst({
      where: {
        OR: [
          ...(input.contact.phone ? [{ phone: input.contact.phone }] : []),
          ...(input.contact.email ? [{ email: input.contact.email }] : []),
        ],
      },
    });
    contactId =
      existing?.id ??
      (
        await db.contact.create({
          data: {
            tenantId: input.tenantId,
            type: 'lead',
            name: input.contact.name ?? input.contact.phone ?? input.contact.email ?? 'Unknown',
            phone: input.contact.phone ?? null,
            email: input.contact.email ?? null,
          },
        })
      ).id;
  }

  let conversation = input.conversationId
    ? await db.conversation.findUnique({ where: { id: input.conversationId } })
    : contactId
      ? await db.conversation.findFirst({
          where: { contactId, channel: input.channel, status: { not: 'CLOSED' } },
          orderBy: { createdAt: 'desc' },
        })
      : null;

  conversation ??= await db.conversation.create({
    data: {
      tenantId: input.tenantId,
      agentId: agent.id,
      contactId,
      channel: input.channel,
    },
  });
  contactId ??= conversation.contactId;

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'user', content: input.message },
  });

  const history = (
    await prisma.message.findMany({
      where: { conversationId: conversation.id, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'asc' },
      take: 30,
    })
  ).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: input.tenantId } });

  const prompts = new InMemoryPromptRegistry();
  const promptKey = `agent:${agent.id}`;
  prompts.register(promptKey, agent.systemPrompt);
  const router = new OpenRouterModelRouter(prompts, { apiKey });

  const log = makeActivityLogger(prisma, input.tenantId, agent.id);
  const allowlist = new Set((agent.tools as string[]) ?? []);
  const tools = buildReceptionistTools(prisma, input.tenantId, log).filter((t) =>
    allowlist.has(t.name),
  );

  let needsHuman = false;
  const result = await runAgent(router, {
    tenantId: input.tenantId,
    promptKey,
    variables: { tenantName: tenant.name },
    tools,
    history,
    onToolCall: async (name, args, output) => {
      if (name === 'handoff.toHuman') needsHuman = true;
      await log({
        contactId: contactId ?? undefined,
        type: 'ai_action',
        payload: { tool: name, args, output },
      });
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: result.reply,
      tokensIn: result.usage.tokensIn,
      tokensOut: result.usage.tokensOut,
      costUsd: result.usage.costUsd,
    },
  });

  if (needsHuman) {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { status: 'NEEDS_HUMAN' },
    });
  }

  await db.aiUsage.create({
    data: {
      tenantId: input.tenantId,
      model: agent.model,
      tokensIn: result.usage.tokensIn,
      tokensOut: result.usage.tokensOut,
      costUsd: result.usage.costUsd,
      feature: 'receptionist',
    },
  });

  return {
    conversationId: conversation.id,
    contactId,
    reply: result.reply,
    needsHuman,
    usage: result.usage,
  };
}
