import type { PrismaClient } from '../generated/client/index';

/**
 * Models that carry a tenantId column. Every query against these MUST be
 * tenant-scoped. Message is scoped through its Conversation.
 * Keep in sync with prisma/schema.prisma.
 */
export const TENANT_MODELS = new Set([
  'User',
  'Contact',
  'Pipeline',
  'Stage',
  'Deal',
  'Activity',
  'Task',
  'Document',
  'DocumentChunk',
  'Agent',
  'Conversation',
  'AiUsage',
  'ConnectorInstall',
  'Workflow',
  'WorkflowRun',
  'Subscription',
]);

const WHERE_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);

const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn']);

/**
 * Wraps a PrismaClient so every query on a tenant model is scoped to one
 * tenant: reads/updates/deletes get `AND tenantId = ...` injected, creates get
 * `tenantId` set. This is the API-layer half of defense-in-depth (RLS in
 * Postgres is the other half — see prisma/rls.sql). Raw queries bypass this
 * wrapper and therefore require code review.
 */
export function tenantClient(prisma: PrismaClient, tenantId: string) {
  if (!tenantId) throw new Error('tenantClient requires a tenantId');

  return prisma.$extends({
    name: `tenant:${tenantId}`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args);
          const a = args as Record<string, unknown>;

          if (CREATE_OPS.has(operation)) {
            if (operation === 'create') {
              a.data = { ...(a.data as object), tenantId };
            } else {
              const rows = a.data as Array<Record<string, unknown>>;
              a.data = rows.map((row) => ({ ...row, tenantId }));
            }
          } else if (operation === 'upsert') {
            // extendedWhereUnique: non-unique filters may sit beside the unique
            // field, and our tenantId always wins over caller input.
            a.where = { ...((a.where as object) ?? {}), tenantId };
            a.create = { ...(a.create as object), tenantId };
          } else if (WHERE_OPS.has(operation)) {
            a.where = { ...((a.where as object) ?? {}), tenantId };
          } else {
            throw new Error(
              `Operation "${operation}" on tenant model "${model}" is not allowed through tenantClient`,
            );
          }
          return query(a as typeof args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof tenantClient>;
