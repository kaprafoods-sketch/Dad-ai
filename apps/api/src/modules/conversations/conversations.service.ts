import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { handleInboundMessage, ReceptionistError } from '@dad-ai/receptionist';
import { PrismaService } from '../../core/prisma.service';

/**
 * Webchat channel of the AI Receptionist (docs/architecture.md §6.3).
 * WhatsApp/email use the same core via the worker's agent.run processor —
 * the shared orchestration lives in @dad-ai/receptionist.
 */
@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

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
    try {
      const result = await handleInboundMessage(this.prisma.client, {
        tenantId,
        channel: 'webchat',
        message: input.message,
        conversationId: input.conversationId,
      });
      return { conversationId: result.conversationId, reply: result.reply };
    } catch (error) {
      if (error instanceof ReceptionistError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }
  }
}
