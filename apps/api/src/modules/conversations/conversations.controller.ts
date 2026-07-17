import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { Ctx, type RequestContext } from '../../core/context';
import { RequiresFeature } from '../../core/feature.guard';
import { ZodValidationPipe } from '../../core/zod.pipe';
import { ConversationsService } from './conversations.service';

const webchatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@Ctx() ctx: RequestContext) {
    return this.conversations.list(ctx.tenantId);
  }

  @Get(':id/messages')
  messages(@Ctx() ctx: RequestContext, @Param('id') id: string) {
    return this.conversations.messages(ctx.tenantId, id);
  }

  @RequiresFeature('ai_chat')
  @Post('webchat')
  webchat(
    @Ctx() ctx: RequestContext,
    @Body(new ZodValidationPipe(webchatSchema)) body: z.infer<typeof webchatSchema>,
  ) {
    return this.conversations.webchat(ctx.tenantId, body);
  }
}
