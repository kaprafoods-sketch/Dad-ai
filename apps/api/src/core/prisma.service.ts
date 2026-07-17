import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { getPrisma, tenantClient, type PrismaClient, type TenantPrismaClient } from '@dad-ai/db';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  /** Platform-level access (Tenant lookups, provisioning). Use tenant() everywhere else. */
  readonly client: PrismaClient = getPrisma();

  /** Tenant-scoped client — the only sanctioned path for business data. */
  tenant(tenantId: string): TenantPrismaClient {
    return tenantClient(this.client, tenantId);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
