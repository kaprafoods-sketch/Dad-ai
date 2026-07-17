import { describe, expect, it } from 'vitest';
import { roleAtLeast, contextFromClaims } from './index';

describe('roleAtLeast', () => {
  it('ranks OWNER above ADMIN above MEMBER above AGENT', () => {
    expect(roleAtLeast('OWNER', 'ADMIN')).toBe(true);
    expect(roleAtLeast('ADMIN', 'ADMIN')).toBe(true);
    expect(roleAtLeast('MEMBER', 'ADMIN')).toBe(false);
    expect(roleAtLeast('AGENT', 'MEMBER')).toBe(false);
  });
});

describe('contextFromClaims', () => {
  it('maps JWT claims to a tenant context', () => {
    const ctx = contextFromClaims({
      sub: 'user-1',
      email: 'a@b.co',
      tenant_id: 'tenant-1',
      role: 'ADMIN',
    });
    expect(ctx).toEqual({ tenantId: 'tenant-1', userId: 'user-1', role: 'ADMIN' });
  });
});
