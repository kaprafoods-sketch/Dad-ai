import { Controller, Get, Headers, UnauthorizedException, Query } from '@nestjs/common';
import { Public } from '../../core/public.decorator';
import { PrismaService } from '../../core/prisma.service';

/**
 * Internal admin endpoints (docs/architecture.md §10). Deployed separately and
 * protected by ADMIN_API_KEY until admin SSO lands. These are cross-tenant by
 * design (platform operations), so they use the platform client, not a
 * tenant-scoped one, and are gated by the key rather than tenant JWT.
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(key: string | undefined) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || key !== expected) throw new UnauthorizedException('Invalid admin key');
  }

  @Public()
  @Get('tenants')
  async tenants(@Headers('x-admin-key') key: string | undefined) {
    this.assertAdmin(key);
    return this.prisma.client.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        industryPack: true,
        plan: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** AI cost per tenant / model / feature — the admin cost dashboard. */
  @Public()
  @Get('ai-costs')
  async aiCosts(
    @Headers('x-admin-key') key: string | undefined,
    @Query('tenantId') tenantId?: string,
  ) {
    this.assertAdmin(key);
    const grouped = await this.prisma.client.aiUsage.groupBy({
      by: ['tenantId', 'model', 'feature'],
      where: tenantId ? { tenantId } : undefined,
      _sum: { tokensIn: true, tokensOut: true, costUsd: true },
    });
    return grouped.map((row) => ({
      tenantId: row.tenantId,
      model: row.model,
      feature: row.feature,
      tokensIn: row._sum.tokensIn ?? 0,
      tokensOut: row._sum.tokensOut ?? 0,
      costUsd: row._sum.costUsd ?? 0,
    }));
  }
}
