import { PrismaClient } from '../generated/client/index';

let prisma: PrismaClient | undefined;

/** Process-wide singleton. Use tenantClient() for all tenant-scoped access. */
export function getPrisma(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}
