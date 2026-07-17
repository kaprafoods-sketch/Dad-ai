import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { encryptCredentials, exchangeGoogleCode, googleAuthUrl } from '@dad-ai/connectors';
import { Ctx, type RequestContext } from '../../core/context';
import { Public } from '../../core/public.decorator';
import { PrismaService } from '../../core/prisma.service';

/**
 * Connector management + OAuth (docs/architecture.md §8). Tokens are
 * AES-256-GCM encrypted before they touch the database.
 */
@Controller('connectors')
export class ConnectorsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Installed connectors for the tenant (credentials never returned). */
  @Get()
  list(@Ctx() ctx: RequestContext) {
    return this.prisma.tenant(ctx.tenantId).connectorInstall.findMany({
      select: { id: true, provider: true, status: true, lastSyncAt: true, createdAt: true },
    });
  }

  /** Start Google OAuth — returns the consent URL to redirect the user to. */
  @Get('google/authorize')
  googleAuthorize(@Ctx() ctx: RequestContext) {
    const config = googleConfig();
    // state carries the tenantId so the callback can attribute the tokens.
    return { url: googleAuthUrl(config, ctx.tenantId) };
  }

  /**
   * Google OAuth callback. Public (Google redirects here without our JWT);
   * the tenant is recovered from `state`. Encrypts + stores the tokens.
   */
  @Public()
  @Get('google/callback')
  @Redirect()
  async googleCallback(@Query('code') code: string, @Query('state') state: string) {
    const appUrl = process.env.CUSTOMER_APP_URL ?? 'http://localhost:3000';
    if (!code || !state) {
      return { url: `${appUrl}/dashboard/settings?connector=google&status=error` };
    }
    const tokens = await exchangeGoogleCode(googleConfig(), code);
    await this.prisma.client.connectorInstall.upsert({
      where: { tenantId_provider: { tenantId: state, provider: 'google' } },
      create: {
        tenantId: state,
        provider: 'google',
        credentials: { enc: encryptCredentials(tokens) },
        status: 'ACTIVE',
      },
      update: {
        credentials: { enc: encryptCredentials(tokens) },
        status: 'ACTIVE',
      },
    });
    return { url: `${appUrl}/dashboard/settings?connector=google&status=connected` };
  }
}

function googleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/v1/connectors/google/callback',
  };
}
