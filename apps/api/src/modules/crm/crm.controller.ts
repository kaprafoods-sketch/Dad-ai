import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { Ctx, type RequestContext } from '../../core/context';
import { ZodValidationPipe } from '../../core/zod.pipe';
import { CrmService } from './crm.service';

const createContactSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1).max(200),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  customFields: z.record(z.unknown()).optional(),
});

const updateContactSchema = createContactSchema.partial();

const createDealSchema = z.object({
  contactId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  value: z.number().nonnegative().optional(),
  customFields: z.record(z.unknown()).optional(),
});

const updateDealSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  value: z.number().nonnegative().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
});

const moveStageSchema = z.object({ stageId: z.string().uuid() });

const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  assigneeId: z.string().uuid().optional(),
  dueAt: z.coerce.date().optional(),
  linkedTo: z.object({ entity: z.string(), id: z.string().uuid() }).optional(),
});

const taskStatusSchema = z.object({ status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']) });

const noteSchema = z.object({ note: z.string().min(1).max(5000) });

@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  private actor(ctx: RequestContext) {
    return { type: 'user' as const, id: ctx.userId };
  }

  // ---- Contacts ----

  @Get('contacts')
  listContacts(@Ctx() ctx: RequestContext, @Query('type') type?: string, @Query('q') q?: string) {
    return this.crm.listContacts(ctx.tenantId, { type, q });
  }

  @Post('contacts')
  createContact(
    @Ctx() ctx: RequestContext,
    @Body(new ZodValidationPipe(createContactSchema)) body: z.infer<typeof createContactSchema>,
  ) {
    return this.crm.createContact(ctx.tenantId, this.actor(ctx), body);
  }

  @Get('contacts/:id')
  getContact(@Ctx() ctx: RequestContext, @Param('id') id: string) {
    return this.crm.getContact(ctx.tenantId, id);
  }

  @Patch('contacts/:id')
  updateContact(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateContactSchema)) body: z.infer<typeof updateContactSchema>,
  ) {
    return this.crm.updateContact(ctx.tenantId, this.actor(ctx), id, body);
  }

  @Get('contacts/:id/timeline')
  timeline(@Ctx() ctx: RequestContext, @Param('id') id: string) {
    return this.crm.timeline(ctx.tenantId, id);
  }

  @Post('contacts/:id/notes')
  addNote(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(noteSchema)) body: z.infer<typeof noteSchema>,
  ) {
    return this.crm.addNote(ctx.tenantId, this.actor(ctx), id, body.note);
  }

  // ---- Pipelines & deals ----

  @Get('pipelines')
  listPipelines(@Ctx() ctx: RequestContext) {
    return this.crm.listPipelines(ctx.tenantId);
  }

  @Get('deals')
  listDeals(
    @Ctx() ctx: RequestContext,
    @Query('pipelineId') pipelineId?: string,
    @Query('status') status?: string,
  ) {
    return this.crm.listDeals(ctx.tenantId, { pipelineId, status });
  }

  @Post('deals')
  createDeal(
    @Ctx() ctx: RequestContext,
    @Body(new ZodValidationPipe(createDealSchema)) body: z.infer<typeof createDealSchema>,
  ) {
    return this.crm.createDeal(ctx.tenantId, this.actor(ctx), body);
  }

  @Patch('deals/:id')
  updateDeal(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDealSchema)) body: z.infer<typeof updateDealSchema>,
  ) {
    return this.crm.updateDeal(ctx.tenantId, this.actor(ctx), id, body);
  }

  @Post('deals/:id/stage')
  moveStage(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveStageSchema)) body: z.infer<typeof moveStageSchema>,
  ) {
    return this.crm.moveDealStage(ctx.tenantId, this.actor(ctx), id, body.stageId);
  }

  // ---- Tasks ----

  @Get('tasks')
  listTasks(@Ctx() ctx: RequestContext, @Query('status') status?: string) {
    return this.crm.listTasks(ctx.tenantId, { status });
  }

  @Post('tasks')
  createTask(
    @Ctx() ctx: RequestContext,
    @Body(new ZodValidationPipe(createTaskSchema)) body: z.infer<typeof createTaskSchema>,
  ) {
    return this.crm.createTask(ctx.tenantId, this.actor(ctx), body);
  }

  @Patch('tasks/:id/status')
  updateTaskStatus(
    @Ctx() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(taskStatusSchema)) body: z.infer<typeof taskStatusSchema>,
  ) {
    return this.crm.updateTaskStatus(ctx.tenantId, id, body.status);
  }
}
