import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifySupabaseJwt } from '@dad-ai/auth';
import type { Plan, Role } from '@dad-ai/shared';
import { PrismaService } from './prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthedRequest } from './context';

/**
 * Request pipeline step 1 (docs/architecture.md §9): verify the Supabase JWT,
 * resolve the tenant, attach RequestContext.
 *
 * DEV_AUTH_BYPASS=1 (local dev before Supabase is connected): trusts
 * x-tenant-id / x-user-id / x-role / x-plan headers instead of a JWT.
 * Never set in staging/prod.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();

    if (process.env.DEV_AUTH_BYPASS === '1') {
      req.auth = {
        tenantId: header(req, 'x-tenant-id') ?? '00000000-0000-0000-0000-000000000000',
        userId: header(req, 'x-user-id') ?? '00000000-0000-0000-0000-000000000001',
        role: (header(req, 'x-role') ?? 'OWNER') as Role,
        plan: (header(req, 'x-plan') ?? 'BUSINESS') as Plan,
      };
      return true;
    }

    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Missing bearer token');

    let claims;
    try {
      claims = await verifySupabaseJwt(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const tenant = await this.prisma.client.tenant.findUnique({
      where: { id: claims.tenant_id },
      select: { id: true, plan: true },
    });
    if (!tenant) throw new UnauthorizedException('Unknown tenant');

    req.auth = {
      tenantId: tenant.id,
      userId: claims.sub,
      role: claims.role,
      plan: tenant.plan as Plan,
    };
    return true;
  }
}

function header(req: AuthedRequest, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
