import { n8nFromEnv } from '@dad-ai/workflow';
import type { PlatformEventPayload } from '@dad-ai/shared';

const bridge = n8nFromEnv();

/**
 * workflow.trigger queue: forward a platform event to the tenant's subscribing
 * n8n workflows. No-op when n8n isn't configured.
 */
export async function processWorkflowTrigger(job: PlatformEventPayload): Promise<void> {
  if (!bridge) {
    console.log(`[workflow.trigger] n8n not configured; skipping ${job.event}`);
    return;
  }
  await bridge.dispatch(job);
}
