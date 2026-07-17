import { Worker } from 'bullmq';
import { QUEUES, type QueueName } from '@dad-ai/shared';

// BullMQ consumers (docs/architecture.md §12). Each queue gets a processor;
// repeated failures go to a dead-letter queue + Sentry alert.
//
// TODO(phase-1): real processors —
//   doc.process      → Document AI pipeline (extract, summarize, chunk, embed)
//   connector.sync   → per-provider sync with rate limiting + backoff
//   agent.run        → agent runtime loop (LLM → tool → repeat)
//   notify.send      → Resend / Twilio / WhatsApp / push
//   workflow.trigger → forward platform events to n8n
//   billing.meter    → nightly AiUsage aggregation

function startWorker(queue: QueueName, redisUrl: string): Worker {
  return new Worker(
    queue,
    async (job) => {
      console.log(`[${queue}] received job ${job.id} (no processor implemented yet)`);
    },
    { connection: { url: redisUrl } },
  );
}

function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL is not set — worker cannot start. See .env.example.');
    process.exit(1);
  }
  const workers = Object.values(QUEUES).map((q) => startWorker(q, redisUrl));
  console.log(`Dad AI worker consuming ${workers.length} queues:`, Object.values(QUEUES));

  const shutdown = async () => {
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
