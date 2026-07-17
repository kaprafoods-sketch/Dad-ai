import { Worker, type Processor } from 'bullmq';
import { QUEUES, type QueueName } from '@dad-ai/shared';
import { getPrisma } from '@dad-ai/db';
import { processDocument } from './processors/document';
import { processAgentRun, type AgentRunJob } from './processors/agent-run';
import { processNotify } from './processors/notify';
import { processWorkflowTrigger } from './processors/workflow-trigger';

// BullMQ consumers (docs/architecture.md §12). Repeated failures go to a
// dead-letter queue + Sentry alert (wired when Sentry DSN is set).

function buildProcessors(): Partial<Record<QueueName, Processor>> {
  const prisma = getPrisma();
  return {
    [QUEUES.DOC_PROCESS]: async (job) =>
      processDocument(prisma, job.data as { tenantId: string; documentId: string; text?: string }),
    [QUEUES.AGENT_RUN]: async (job) => processAgentRun(prisma, job.data as AgentRunJob),
    [QUEUES.NOTIFY_SEND]: async (job) => processNotify(job.data as never),
    [QUEUES.WORKFLOW_TRIGGER]: async (job) => processWorkflowTrigger(job.data as never),
    // TODO(phase-2): connector.sync (per-provider rate limiting + backoff),
    // billing.meter (nightly AiUsage aggregation).
  };
}

function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL is not set — worker cannot start. See .env.example.');
    process.exit(1);
  }

  const processors = buildProcessors();
  const workers = Object.values(QUEUES).map(
    (queue) =>
      new Worker(
        queue,
        processors[queue] ??
          (async (job) => {
            console.log(`[${queue}] job ${job.id}: no processor implemented yet`);
          }),
        { connection: { url: redisUrl } },
      ),
  );
  console.log(`Dad AI worker consuming ${workers.length} queues:`, Object.values(QUEUES));

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      console.error(`[${worker.name}] job ${job?.id} failed:`, err.message);
    });
  }

  const shutdown = async () => {
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
