import {
  ForbiddenException,
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { planHasFeature, type Feature } from '@dad-ai/billing';
import type { AuthedRequest } from './context';

const FEATURE_KEY = 'dadai:feature';

/** `@RequiresFeature('ai_receptionist')` — plan gating (docs/architecture.md §13). */
export const RequiresFeature = (feature: Feature) => SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const feature = this.reflector.getAllAndOverride<Feature | undefined>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!feature) return true;
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth) return true;
    if (!planHasFeature(req.auth.plan, feature)) {
      throw new ForbiddenException(`Plan ${req.auth.plan} does not include "${feature}"`);
    }
    return true;
  }
}
