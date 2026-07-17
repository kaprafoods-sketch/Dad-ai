import { notify, type NotifyRequest } from '@dad-ai/notify';

/** notify.send queue: dispatch an email/SMS/WhatsApp notification. */
export async function processNotify(job: NotifyRequest): Promise<void> {
  const result = await notify(job);
  console.log(`[notify.send] sent ${job.channel} via ${result.provider} (${result.id})`);
}
