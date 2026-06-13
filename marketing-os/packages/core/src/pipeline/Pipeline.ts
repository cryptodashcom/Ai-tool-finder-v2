import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/index.js';
import { campaigns, campaignPosts, auditLogs } from '../db/schema.js';
import type {
  CampaignBrief,
  PipelineContext,
  PipelineStage,
  Platform,
  AuditLevel,
} from '../types/index.js';

export interface StageHandler {
  name: PipelineStage;
  run(ctx: PipelineContext, db: Db): Promise<void>;
}

export class Pipeline {
  private stages: StageHandler[] = [];

  constructor(private readonly db: Db) {}

  use(handler: StageHandler): this {
    this.stages.push(handler);
    return this;
  }

  async run(brief: CampaignBrief): Promise<PipelineContext> {
    const campaignId = nanoid();
    const now = new Date();

    const ctx: PipelineContext = {
      campaignId,
      brief,
      errors: [],
      startedAt: now,
      status: 'running',
    };

    await this.db.insert(campaigns).values({
      id: campaignId,
      brief: brief as unknown as Record<string, unknown>,
      status: 'running',
      createdAt: now,
      updatedAt: now,
    });

    await this.audit(campaignId, 'pipeline', 'pipeline.started', { platforms: brief.platforms }, 'info');

    for (const stage of this.stages) {
      try {
        await this.audit(campaignId, stage.name, `${stage.name}.started`, null, 'info');
        await stage.run(ctx, this.db);
        await this.audit(campaignId, stage.name, `${stage.name}.completed`, null, 'info');
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        ctx.errors.push({ stage: stage.name, error, timestamp: new Date() });
        await this.audit(campaignId, stage.name, `${stage.name}.failed`, { error }, 'error');
        ctx.status = 'failed';
        break;
      }
    }

    if (ctx.status !== 'failed') {
      ctx.status = 'completed';
      ctx.completedAt = new Date();
    }

    await this.db
      .update(campaigns)
      .set({
        strategy: ctx.strategy as unknown as Record<string, unknown> | undefined,
        status: ctx.status,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    await this.audit(campaignId, 'pipeline', 'pipeline.finished', { status: ctx.status }, 'info');
    return ctx;
  }

  private async audit(
    campaignId: string,
    stage: string,
    event: string,
    payload: unknown,
    level: AuditLevel,
  ) {
    await this.db.insert(auditLogs).values({
      id: nanoid(),
      campaignId,
      stage,
      event,
      payload: payload as Record<string, unknown> | null,
      level,
      createdAt: new Date(),
    });
  }
}
