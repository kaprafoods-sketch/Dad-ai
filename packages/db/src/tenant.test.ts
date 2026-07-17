import { describe, expect, it } from 'vitest';
import { tenantClient, TENANT_MODELS } from './tenant';
import type { PrismaClient } from '../generated/client/index';

const TENANT = '11111111-1111-1111-1111-111111111111';

/**
 * Builds a fake PrismaClient whose $extends mimics the real query-extension
 * contract enough to observe what args the wrapper injects. We capture the
 * final args each model operation would run with.
 */
function fakeClient() {
  const captured: { model?: string; operation: string; args: Record<string, unknown> } = {
    operation: '',
    args: {},
  };

  const extension = { query: undefined as unknown };

  const client = {
    $extends(ext: { query: { $allModels: { $allOperations: Function } } }) {
      extension.query = ext.query;
      const handler = ext.query.$allModels.$allOperations;
      const makeModel = (model: string) =>
        new Proxy(
          {},
          {
            get(_t, operation: string) {
              return (args: Record<string, unknown>) =>
                handler({
                  model,
                  operation,
                  args,
                  query: (finalArgs: Record<string, unknown>) => {
                    captured.model = model;
                    captured.operation = operation;
                    captured.args = finalArgs;
                    return Promise.resolve(finalArgs);
                  },
                });
            },
          },
        );
      return {
        contact: makeModel('Contact'),
        tenant: makeModel('Tenant'),
      };
    },
  } as unknown as PrismaClient;

  return { client, captured };
}

describe('tenantClient', () => {
  it('requires a tenantId', () => {
    const { client } = fakeClient();
    expect(() => tenantClient(client, '')).toThrow(/tenantId/);
  });

  it('injects tenantId into create data', async () => {
    const { client, captured } = fakeClient();
    const db = tenantClient(client, TENANT);
    await db.contact.create({ data: { name: 'Bob', type: 'lead' } as never });
    expect((captured.args.data as Record<string, unknown>).tenantId).toBe(TENANT);
  });

  it('injects tenantId into findMany where clause', async () => {
    const { client, captured } = fakeClient();
    const db = tenantClient(client, TENANT);
    await db.contact.findMany({ where: { type: 'lead' } });
    expect(captured.args.where).toMatchObject({ tenantId: TENANT, type: 'lead' });
  });

  it('scopes a query with no where clause', async () => {
    const { client, captured } = fakeClient();
    const db = tenantClient(client, TENANT);
    await db.contact.findMany({});
    expect(captured.args.where).toEqual({ tenantId: TENANT });
  });

  it('overrides a caller-supplied tenantId (cannot be spoofed)', async () => {
    const { client, captured } = fakeClient();
    const db = tenantClient(client, TENANT);
    await db.contact.findMany({ where: { tenantId: 'attacker-tenant' } });
    expect((captured.args.where as Record<string, unknown>).tenantId).toBe(TENANT);
  });

  it('does not scope non-tenant models like Tenant', async () => {
    const { client, captured } = fakeClient();
    const db = tenantClient(client, TENANT);
    await db.tenant.findMany({ where: { slug: 'acme' } });
    expect(captured.args.where).toEqual({ slug: 'acme' });
  });
});

describe('TENANT_MODELS', () => {
  it('includes every tenant-scoped model and excludes Tenant', () => {
    expect(TENANT_MODELS.has('Contact')).toBe(true);
    expect(TENANT_MODELS.has('AiUsage')).toBe(true);
    expect(TENANT_MODELS.has('Tenant')).toBe(false); // scoped by id, not tenantId
  });
});
