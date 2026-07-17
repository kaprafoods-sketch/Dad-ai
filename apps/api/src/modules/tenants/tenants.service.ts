import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { applyIndustryPack } from '@dad-ai/packs';
import type { IndustryPack } from '@dad-ai/shared';
import { PrismaService } from '../../core/prisma.service';

/** Walks up from cwd to find the repo's templates/ directory. */
export function resolveTemplatesRoot(): string {
  if (process.env.TEMPLATES_DIR) return process.env.TEMPLATES_DIR;
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = join(dir, 'templates');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('templates/ directory not found — set TEMPLATES_DIR');
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Provisioning flow (docs/industry-packs.md): create tenant → seed from the
   * industry pack → create the owner user. Target: live in under 5 minutes.
   */
  async provision(input: {
    name: string;
    slug: string;
    industryPack: IndustryPack;
    ownerEmail: string;
  }) {
    const tenant = await this.prisma.client.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        industryPack: input.industryPack,
      },
    });

    const applied = await applyIndustryPack(this.prisma.client, tenant.id, resolveTemplatesRoot());

    await this.prisma.client.user.create({
      data: { tenantId: tenant.id, email: input.ownerEmail, role: 'OWNER' },
    });

    return { tenant, applied };
  }

  async getTenant(tenantId: string) {
    const tenant = await this.prisma.client.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
