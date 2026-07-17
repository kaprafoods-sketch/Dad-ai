/**
 * Google connector (Calendar/Gmail/Drive). Build order #2
 * (docs/architecture.md §8). OAuth 2.0 authorization-code flow; tokens are
 * encrypted via crypto.ts before landing in ConnectorInstall.credentials.
 */

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'openid',
  'email',
];

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  scope: string;
}

/**
 * Build the consent URL. `state` MUST encode the tenantId (signed/opaque) so
 * the callback can attribute the tokens to the right tenant.
 */
export function googleAuthUrl(config: GoogleOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES.join(' '),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchange an authorization code for tokens (callback handler). */
export async function exchangeGoogleCode(
  config: GoogleOAuthConfig,
  code: string,
): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
}

/** Refresh an expired access token. */
export async function refreshGoogleToken(
  config: GoogleOAuthConfig,
  refreshToken: string,
): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number; scope: string };
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  };
}
