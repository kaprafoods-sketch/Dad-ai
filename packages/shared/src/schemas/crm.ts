import { z } from 'zod';
import { DEAL_STATUSES, TASK_STATUSES, ACTOR_TYPES } from '../enums';

export const contactSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  type: z.string().min(1), // pack-driven: customer | lead | candidate | patient | client
  name: z.string().min(1).max(200),
  phone: z.string().max(32).nullish(),
  email: z.string().email().nullish(),
  customFields: z.record(z.unknown()).default({}),
});
export type Contact = z.infer<typeof contactSchema>;

export const createContactSchema = contactSchema.omit({ id: true, tenantId: true });
export type CreateContactInput = z.infer<typeof createContactSchema>;

export const dealSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  contactId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  title: z.string().min(1).max(200),
  value: z.number().nonnegative().default(0),
  status: z.enum(DEAL_STATUSES).default('OPEN'),
  customFields: z.record(z.unknown()).default({}),
});
export type Deal = z.infer<typeof dealSchema>;

export const activitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  contactId: z.string().uuid().nullish(),
  dealId: z.string().uuid().nullish(),
  type: z.string().min(1), // call | email | whatsapp | note | task | meeting | ai_action
  payload: z.record(z.unknown()),
  actorType: z.enum(ACTOR_TYPES),
  actorId: z.string().nullish(),
});
export type Activity = z.infer<typeof activitySchema>;

export const taskSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(300),
  assigneeId: z.string().uuid().nullish(),
  dueAt: z.coerce.date().nullish(),
  status: z.enum(TASK_STATUSES).default('TODO'),
  linkedTo: z.object({ entity: z.string(), id: z.string().uuid() }).nullish(),
});
export type Task = z.infer<typeof taskSchema>;
