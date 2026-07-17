import { z } from 'zod';
import { PLANS } from '../enums';

// Schema for templates/{pack}/ bundle files. See docs/industry-packs.md.

export const customFieldDefSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string(),
  type: z.enum(['text', 'number', 'date', 'select', 'multiselect', 'boolean', 'currency']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select/multiselect
});
export type CustomFieldDef = z.infer<typeof customFieldDefSchema>;

export const packMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  minPlan: z.enum(PLANS).default('TRIAL'),
});
export type PackMeta = z.infer<typeof packMetaSchema>;

export const packEntitiesSchema = z.object({
  contactTypes: z.array(
    z.object({
      type: z.string(),
      label: z.string(),
      customFields: z.array(customFieldDefSchema),
    }),
  ),
  dealCustomFields: z.array(customFieldDefSchema).default([]),
});
export type PackEntities = z.infer<typeof packEntitiesSchema>;

export const packPipelinesSchema = z.object({
  pipelines: z.array(
    z.object({
      name: z.string(),
      stages: z.array(z.string()).min(1),
    }),
  ),
});
export type PackPipelines = z.infer<typeof packPipelinesSchema>;

export const packUiSchema = z.object({
  terminology: z.record(z.string()), // e.g. { "Contact": "Patient" }
  nav: z.array(z.object({ key: z.string(), label: z.string() })),
  dashboardWidgets: z.array(z.string()),
});
export type PackUi = z.infer<typeof packUiSchema>;

export const packConnectorsSchema = z.object({
  recommended: z.array(z.string()),
});
export type PackConnectors = z.infer<typeof packConnectorsSchema>;

/** Build a zod validator for a customFields payload from a pack's field defs. */
export function buildCustomFieldsValidator(defs: CustomFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const def of defs) {
    let field: z.ZodTypeAny;
    switch (def.type) {
      case 'number':
      case 'currency':
        field = z.number();
        break;
      case 'date':
        field = z.coerce.date();
        break;
      case 'boolean':
        field = z.boolean();
        break;
      case 'select':
        field = def.options?.length ? z.enum(def.options as [string, ...string[]]) : z.string();
        break;
      case 'multiselect':
        field = z.array(
          def.options?.length ? z.enum(def.options as [string, ...string[]]) : z.string(),
        );
        break;
      default:
        field = z.string();
    }
    shape[def.key] = def.required ? field : field.optional();
  }
  return z.object(shape).passthrough();
}
