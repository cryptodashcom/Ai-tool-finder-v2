import type { CampaignBrief } from '@marketing-os/core';
import { runCampaignJob } from './CampaignJob.js';

interface QueuedJob {
  id: string;
  brief: CampaignBrief;
  addedAt: Date;
}

export class JobRunner {
  private queue: QueuedJob[] = [];
  private running = false;

  enqueue(id: string, brief: CampaignBrief): void {
    this.queue.push({ id, brief, addedAt: new Date() });
    console.log(`[JobRunner] Queued job ${id} (queue depth: ${this.queue.length})`);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    console.log('[JobRunner] Starting...');

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      console.log(`[JobRunner] Processing job ${job.id}`);
      try {
        const ctx = await runCampaignJob(job.brief);
        console.log(`[JobRunner] Job ${job.id} finished with status: ${ctx.status}`);
        if (ctx.errors.length > 0) {
          console.error(`[JobRunner] Errors:`, ctx.errors);
        }
      } catch (err) {
        console.error(`[JobRunner] Job ${job.id} threw:`, err);
      }
    }

    this.running = false;
    console.log('[JobRunner] Queue empty, runner stopped.');
  }
}
