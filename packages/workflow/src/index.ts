// Workflow engine bridge. Phase 1: self-hosted n8n, workflows namespaced by
// tenant (tag = tenantId). Phase 2: Temporal for critical flows.
// See docs/architecture.md §7.

import type { PlatformEvent, PlatformEventPayload } from '@dad-ai/shared';

export interface WorkflowBridge {
  /** Install an n8n workflow export for a tenant (tagged with tenantId). */
  install(tenantId: string, name: string, definition: unknown): Promise<{ workflowId: string }>;
  activate(tenantId: string, workflowId: string): Promise<void>;
  deactivate(tenantId: string, workflowId: string): Promise<void>;
  /** Forward a platform event to all subscribed tenant workflows. */
  dispatch(payload: PlatformEventPayload): Promise<void>;
}

export interface WorkflowTriggerDef {
  type: 'webhook' | 'schedule' | 'event';
  event?: PlatformEvent; // when type === "event"
  cron?: string; // when type === "schedule"
}

// n8n calls back into the Dad AI API with a per-tenant scoped service token —
// never master credentials.
export interface ServiceTokenIssuer {
  issue(tenantId: string, scopes: string[]): Promise<string>;
  verify(token: string): Promise<{ tenantId: string; scopes: string[] }>;
}

// TODO(phase-2): N8nBridge implementation via the n8n REST API.
