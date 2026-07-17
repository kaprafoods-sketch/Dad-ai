import { describe, expect, it } from 'vitest';
import { buildCustomFieldsValidator, packEntitiesSchema } from './pack';

describe('buildCustomFieldsValidator', () => {
  it('enforces required fields and types', () => {
    const validator = buildCustomFieldsValidator([
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'mrr', label: 'MRR', type: 'currency', required: false },
    ]);
    expect(validator.safeParse({ company: 'Acme', mrr: 5000 }).success).toBe(true);
    expect(validator.safeParse({ mrr: 5000 }).success).toBe(false); // missing required
    expect(validator.safeParse({ company: 'Acme', mrr: 'lots' }).success).toBe(false); // wrong type
  });

  it('validates select options', () => {
    const validator = buildCustomFieldsValidator([
      { key: 'source', label: 'Source', type: 'select', required: true, options: ['a', 'b'] },
    ]);
    expect(validator.safeParse({ source: 'a' }).success).toBe(true);
    expect(validator.safeParse({ source: 'z' }).success).toBe(false);
  });

  it('passes through unknown keys (custom fields are additive)', () => {
    const validator = buildCustomFieldsValidator([]);
    expect(validator.safeParse({ anything: 1 }).success).toBe(true);
  });
});

describe('packEntitiesSchema', () => {
  it('parses a valid entities bundle', () => {
    const parsed = packEntitiesSchema.parse({
      contactTypes: [{ type: 'lead', label: 'Lead', customFields: [] }],
      dealCustomFields: [],
    });
    expect(parsed.contactTypes[0]?.type).toBe('lead');
  });
});
