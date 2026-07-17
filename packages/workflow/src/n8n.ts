import type { PlatformEventPayload } from '@dad-ai/shared';
import type { WorkflowBridge } from './index';

/**
 * n8n bridge (docs/architecture.md §7). Manages tenant-namespaced workflows via
 * the n8n REST API and dispatches platform events to their webhook triggers.
 * Workflows are tagged with the tenantId so one n8n instance serves all tenants.
 */
export class N8nBridge implements WorkflowBridge {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private headers() {
    return { 'X-N8N-API-KEY': this.apiKey, 'Content-Type': 'application/json' };
  }

  async install(
    tenantId: string,
    name: string,
    definition: unknown,
  ): Promise<{ workflowId: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name: `[${tenantId}] ${name}`,
        ...(definition as object),
        // Tag so this instance's workflows stay namespaced per tenant.
        settings: { ...((definition as { settings?: object })?.settings ?? {}) },
      }),
    });
    if (!res.ok) throw new Error(`n8n install ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { id: string };
    return { workflowId: data.id };
  }

  async activate(_tenantId: string, workflowId: string): Promise<void> {
    await this.setActive(workflowId, true);
  }

  async deactivate(_tenantId: string, workflowId: string): Promise<void> {
    await this.setActive(workflowId, false);
  }

  private async setActive(workflowId: string, active: boolean): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/api/v1/workflows/${workflowId}/${active ? 'activate' : 'deactivate'}`,
      { method: 'POST', headers: this.headers() },
    );
    if (!res.ok) throw new Error(`n8n ${active ? 'activate' : 'deactivate'} ${res.status}`);
  }

  /**
   * Dispatch a platform event to the tenant's subscribing workflows by hitting
   * the event-named webhook path. n8n workflows subscribe by listening on
   * /webhook/{tenantId}/{event}.
   */
  async dispatch(payload: PlatformEventPayload): Promise<void> {
    const url = `${this.baseUrl}/webhook/${payload.tenantId}/${payload.event}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // A 404 just means no workflow subscribes to this event — not an error.
    if (!res.ok && res.status !== 404) {
      throw new Error(`n8n dispatch ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
  }
}

/** Factory: returns a bridge, or null if n8n isn't configured (dispatch no-ops). */
export function n8nFromEnv(): N8nBridge | null {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;
  return baseUrl && apiKey ? new N8nBridge(baseUrl, apiKey) : null;
}
