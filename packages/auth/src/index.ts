// Auth helpers: Supabase JWT claims + RBAC. Enforced in the API's
// AuthGuard → TenantResolver → RBAC Guard pipeline (docs/architecture.md §9).

import type { Role } from '@dad-ai/shared';

/** Custom claims Dad AI sets on the Supabase JWT at login. */
export interface DadAiJwtClaims {
  sub: string; // user id (auth.users.id)
  email: string;
  tenant_id: string; // drives RLS: tenant_id = auth.jwt() ->> 'tenant_id'
  role: Role;
}

const ROLE_RANK: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
  AGENT: 0, // AI agents act via scoped service tokens, lowest privilege
};

export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: Role;
}

export function contextFromClaims(claims: DadAiJwtClaims): TenantContext {
  return { tenantId: claims.tenant_id, userId: claims.sub, role: claims.role };
}

// TODO(phase-0): Supabase JWT verification helper (jwks), NestJS guards in apps/api.
