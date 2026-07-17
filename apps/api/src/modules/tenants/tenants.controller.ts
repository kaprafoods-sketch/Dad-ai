import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { createTenantSchema, type CreateTenantInput } from '@dad-ai/shared';
import { Ctx, type RequestContext } from '../../core/context';
import { Public } from '../../core/public.decorator';
import { ZodValidationPipe } from '../../core/zod.pipe';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  /**
   * Platform-level provisioning — not a tenant route. Protected by
   * ADMIN_API_KEY until the admin panel gets SSO; called from apps/admin or
   * from an agency-CRM onboarding workflow (docs/agency-crm.md).
   */
  @Public()
  @Post()
  provision(
    @Headers('x-admin-key') adminKey: string | undefined,
    @Body(new ZodValidationPipe(createTenantSchema)) body: CreateTenantInput,
  ) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected || adminKey !== expected) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return this.tenants.provision(body);
  }

  /** The tenant's own record — settings carry the pack ui.json for the frontend. */
  @Get('me')
  me(@Ctx() ctx: RequestContext) {
    return this.tenants.getTenant(ctx.tenantId);
  }
}
