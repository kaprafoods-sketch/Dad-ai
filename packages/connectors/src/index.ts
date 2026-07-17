// Connector layer: one interface, many implementations.
// See docs/architecture.md §8. Credentials are AES-256-GCM encrypted at rest.

import type { PlatformEventPayload } from '@dad-ai/shared';

export interface AuthParams {
  [key: string]: unknown;
}

export interface Credentials {
  [key: string]: unknown;
}

export interface SyncResult {
  created: number;
  updated: number;
  errors: number;
}

export interface ConnectorQuery {
  entity: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface ConnectorRecord {
  id: string;
  entity: string;
  data: Record<string, unknown>;
}

export interface Connector {
  provider: string;
  authenticate(tenantId: string, params: AuthParams): Promise<Credentials>;
  refreshAuth?(creds: Credentials): Promise<Credentials>;
  /** Pull-based sync; runs in the worker (connector.sync queue) with backoff. */
  sync(tenantId: string, since?: Date): Promise<SyncResult>;
  /** Push-based ingress; MUST verify the signature before parsing. */
  handleWebhook(payload: unknown, signature: string): Promise<PlatformEventPayload[]>;
  search?(query: ConnectorQuery): Promise<ConnectorRecord[]>;
  create?(entity: string, data: unknown): Promise<ConnectorRecord>;
  update?(entity: string, id: string, data: unknown): Promise<ConnectorRecord>;
  remove?(entity: string, id: string): Promise<void>;
}

export class ConnectorRegistry {
  private connectors = new Map<string, Connector>();

  register(connector: Connector): void {
    this.connectors.set(connector.provider, connector);
  }

  get(provider: string): Connector {
    const connector = this.connectors.get(provider);
    if (!connector) throw new Error(`Unknown connector provider: ${provider}`);
    return connector;
  }

  list(): string[] {
    return [...this.connectors.keys()];
  }
}

// Build order (docs/architecture.md §8): whatsapp → google → razorpay →
// resend/twilio → vertical-specific (99acres, naukri, …) per pack launch.
