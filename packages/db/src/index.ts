export { PrismaClient, Prisma } from '../generated/client/index';
export { getPrisma } from './client';
export { tenantClient, TENANT_MODELS, type TenantPrismaClient } from './tenant';
