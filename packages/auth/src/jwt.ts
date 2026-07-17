import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { DadAiJwtClaims } from './index';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/**
 * Verifies a Supabase access token and extracts Dad AI claims.
 * - HS256 with SUPABASE_JWT_SECRET (Supabase legacy JWT secret), or
 * - asymmetric keys via the project JWKS endpoint when only SUPABASE_URL is set.
 */
export async function verifySupabaseJwt(token: string): Promise<DadAiJwtClaims> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;

  let payload: JWTPayload;
  if (secret) {
    ({ payload } = await jwtVerify(token, new TextEncoder().encode(secret)));
  } else if (supabaseUrl) {
    jwks ??= createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
    ({ payload } = await jwtVerify(token, jwks));
  } else {
    throw new Error('Set SUPABASE_JWT_SECRET or SUPABASE_URL to verify tokens');
  }

  const tenantId = payload['tenant_id'];
  if (typeof payload.sub !== 'string' || typeof tenantId !== 'string') {
    throw new Error('Token is missing sub/tenant_id claims');
  }
  return {
    sub: payload.sub,
    email: typeof payload['email'] === 'string' ? payload['email'] : '',
    tenant_id: tenantId,
    role: (payload['role_dadai'] ?? payload['role'] ?? 'MEMBER') as DadAiJwtClaims['role'],
  };
}
