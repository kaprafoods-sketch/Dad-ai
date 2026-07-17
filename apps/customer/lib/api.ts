// API client. Until Supabase auth is wired (Phase 0), requests authenticate
// via the API's DEV_AUTH_BYPASS headers; afterwards this swaps to the Supabase
// session's bearer token with zero call-site changes.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const devTenant = process.env.NEXT_PUBLIC_DEV_TENANT_ID;
  const res = await fetch(`${BASE_URL}/v1${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(devTenant ? { 'x-tenant-id': devTenant } : {}),
      ...init?.headers,
    },
    ...(init?.json !== undefined ? { body: JSON.stringify(init.json) } : {}),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export interface Contact {
  id: string;
  type: string;
  name: string;
  phone: string | null;
  email: string | null;
  customFields: Record<string, unknown>;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export interface Deal {
  id: string;
  title: string;
  value: string | number;
  status: 'OPEN' | 'WON' | 'LOST';
  stageId: string;
  pipelineId: string;
  contact: { id: string; name: string };
}

export interface TenantMe {
  id: string;
  name: string;
  industryPack: string;
  settings: {
    pack?: {
      ui?: {
        terminology?: Record<string, string>;
        nav?: Array<{ key: string; label: string }>;
      };
    };
  };
}
