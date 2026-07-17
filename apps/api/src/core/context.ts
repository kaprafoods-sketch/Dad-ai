import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Plan, Role } from '@dad-ai/shared';
import type { Request } from 'express';

/** Attached to every authenticated request by AuthGuard. */
export interface RequestContext {
  tenantId: string;
  userId: string;
  role: Role;
  plan: Plan;
}

export type AuthedRequest = Request & { auth?: RequestContext };

/** Route param decorator: `handler(@Ctx() ctx: RequestContext)` */
export const Ctx = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest<AuthedRequest>();
  if (!req.auth) throw new Error('RequestContext missing — is the route public?');
  return req.auth;
});
