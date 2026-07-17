import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { z } from 'zod';
import { Ctx, type RequestContext } from '../../core/context';
import { MinRole } from '../../core/roles.guard';
import { ZodValidationPipe } from '../../core/zod.pipe';
import { PrismaService } from '../../core/prisma.service';

const updateAgentSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  systemPrompt: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  tools: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

@Controller('agents')
export class AgentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Ctx() ctx: RequestContext) {
    return this.prisma.tenant(ctx.tenantId).agent.findMany({ orderBy: { createdAt: 'asc' } });
  }

  /** Prompt/tool edits are tenant-owned customization (docs/industry-packs.md). */
  @MinRole('ADMIN')
  @Patch(':id')
  update(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAgentSchema)) body: z.infer<typeof updateAgentSchema>,
  ) {
    return this.prisma.tenant(ctx.tenantId).agent.update({ where: { id }, data: body });
  }
}
