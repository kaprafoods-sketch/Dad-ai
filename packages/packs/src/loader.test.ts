import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { loadPack, packDirFor } from './loader';

// Loads the real bundles committed under templates/.
const TEMPLATES_ROOT = join(__dirname, '../../../templates');

describe('packDirFor', () => {
  it('maps enum values to directory names', () => {
    expect(packDirFor('AGENCY')).toBe('agency');
    expect(packDirFor('REAL_ESTATE')).toBe('real-estate');
  });
});

describe('loadPack', () => {
  it('loads and validates the agency pack', () => {
    const pack = loadPack(TEMPLATES_ROOT, 'AGENCY');
    expect(pack.meta.id).toBe('agency');
    expect(pack.pipelines.pipelines[0]?.stages).toContain('Onboarding');
    expect(pack.prompts.receptionist).toContain('receptionist');
    expect(pack.ui.terminology.Contact).toBe('Client');
  });

  it('loads and validates the real-estate pack', () => {
    const pack = loadPack(TEMPLATES_ROOT, 'REAL_ESTATE');
    expect(pack.meta.id).toBe('real-estate');
    expect(pack.pipelines.pipelines[0]?.stages).toEqual([
      'Lead',
      'Site Visit',
      'Booking',
      'Agreement',
      'Payment',
    ]);
  });

  it('loads and validates every shipped pack', () => {
    for (const pack of ['AGENCY', 'REAL_ESTATE', 'RECRUITMENT', 'CLINIC', 'CA', 'LEGAL'] as const) {
      const bundle = loadPack(TEMPLATES_ROOT, pack);
      expect(bundle.meta.id).toBeTruthy();
      expect(bundle.pipelines.pipelines.length).toBeGreaterThan(0);
      expect(bundle.prompts.receptionist).toBeTruthy();
      expect(Object.keys(bundle.ui.terminology).length).toBeGreaterThan(0);
    }
  });
});
