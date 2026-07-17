import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES, type QueueName } from '@dad-ai/shared';

/**
 * Producer side of BullMQ. Controllers enqueue jobs; apps/worker consumes them.
 * No-op safe: if REDIS_URL is unset (local dev before Upstash), enqueue()
 * throws a clear error rather than silently dropping work.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private queues = new Map<QueueName, Queue>();

  private get(name: QueueName): Queue {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is not set — cannot enqueue background jobs');
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, { connection: { url } });
      this.queues.set(name, queue);
    }
    return queue;
  }

  async enqueue(name: QueueName, data: unknown, jobId?: string): Promise<void> {
    // jobId gives idempotency for webhook/workflow-driven producers.
    await this.get(name).add(name, data, jobId ? { jobId } : undefined);
  }

  get queueNames(): QueueName[] {
    return Object.values(QUEUES);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
