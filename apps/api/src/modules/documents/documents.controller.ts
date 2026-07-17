import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { QUEUES } from '@dad-ai/shared';
import { Ctx, type RequestContext } from '../../core/context';
import { RequiresFeature } from '../../core/feature.guard';
import { ZodValidationPipe } from '../../core/zod.pipe';
import { PrismaService } from '../../core/prisma.service';
import { QueueService } from '../../core/queue.service';

// Registers an uploaded document and kicks off the doc.process pipeline.
// The actual file bytes live in Supabase Storage; the client uploads there
// with a signed URL, then calls this with the resulting storagePath. For local
// dev / text sources, `text` can be passed inline.
const registerSchema = z.object({
  storagePath: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  text: z.string().optional(),
});

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  @Get()
  list(@Ctx() ctx: RequestContext, @Query('status') status?: string) {
    return this.prisma.tenant(ctx.tenantId).document.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @RequiresFeature('documents')
  @Post()
  async register(
    @Ctx() ctx: RequestContext,
    @Body(new ZodValidationPipe(registerSchema)) body: z.infer<typeof registerSchema>,
  ) {
    const doc = await this.prisma.tenant(ctx.tenantId).document.create({
      data: {
        tenantId: ctx.tenantId,
        storagePath: body.storagePath,
        filename: body.filename,
        mimeType: body.mimeType,
        status: 'UPLOADED',
      },
    });
    await this.queue.enqueue(
      QUEUES.DOC_PROCESS,
      { tenantId: ctx.tenantId, documentId: doc.id, text: body.text },
      doc.id, // idempotency
    );
    return doc;
  }

  @Get(':id')
  get(@Ctx() ctx: RequestContext, @Param('id') id: string) {
    return this.prisma.tenant(ctx.tenantId).document.findUnique({ where: { id } });
  }
}
