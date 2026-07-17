import { Worker, type Processor } from 'bullmq';
import { QUEUES, type QueueName } from '@dad-ai/shared';
import { getPrisma } from '@dad-ai/db';
import { processDocument } from './processors/document';

// BullMQ consumers (docs/architecture.md §12). Each queue gets a processor;
// repeated failures go to a dead-letter queue + Sentry alert (Phase 1).

function buildProcessors(): Partial<Record<QueueName, Processor>> {
  const prisma = getPrisma();
  return {
    [QUEUES.DOC_PROCESS]: async (job) =>
      processDocument(prisma, job.data as { tenantId: string; documentId: string; text?: string }),
    // TODO(phase-2): connector.sync (per-provider rate limiting + backoff),
    // agent.run (channel webhooks → ConversationsService core),
    // notify.send (Resend/Twilio/WhatsApp), workflow.trigger (n8n dispatch),
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

  const shutdown = async () => {
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
