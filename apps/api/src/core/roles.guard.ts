import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { roleAtLeast } from '@dad-ai/auth';
import type { Role } from '@dad-ai/shared';
import type { AuthedRequest } from './context';

const ROLES_KEY = 'dadai:minRole';

/** `@MinRole('ADMIN')` — requires the caller's role to be at least this. */
export const MinRole = (role: Role) => SetMetadata(ROLES_KEY, role);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth) return true; // public route
    if (!roleAtLeast(req.auth.role, required)) {
      throw new ForbiddenException(`Requires role ${required}`);
    }
    return true;
  }
}
