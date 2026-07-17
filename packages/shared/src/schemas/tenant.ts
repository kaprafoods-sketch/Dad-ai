import { z } from 'zod';
import { INDUSTRY_PACKS, PLANS, ROLES } from '../enums';

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'lowercase alphanumeric + hyphens'),
  industryPack: z.enum(INDUSTRY_PACKS),
  plan: z.enum(PLANS),
  settings: z.record(z.unknown()).default({}),
});
export type Tenant = z.infer<typeof tenantSchema>;

export const createTenantSchema = tenantSchema
  .pick({ name: true, slug: true, industryPack: true })
  .extend({
    ownerEmail: z.string().email(),
  });
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(ROLES),
});
export type User = z.infer<typeof userSchema>;
