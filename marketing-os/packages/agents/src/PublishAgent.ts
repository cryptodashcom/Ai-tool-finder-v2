import type { PublishResult, PipelineContext, Platform } from '@marketing-os/core';
import type { Db } from '@marketing-os/core';
import type { StageHandler } from '@marketing-os/core';
import { eq } from 'drizzle-orm';
import { campaignPosts } from '@marketing-os/core';
import type { ChannelAdapter } from '@marketing-os/channels';
import { BaseAgent } from './BaseAgent.js';

export class PublishAgent extends BaseAgent implements StageHandler {
  name = 'publish' as const;

  constructor(
    private readonly adapters: Map<Platform, ChannelAdapter>,
    model?: string,
  ) {
    super(model);
  }

  async run(ctx: PipelineContext, db: Db): Promise<void> {
    if (!ctx.copies) throw new Error('Copy must run before PublishAgent');

    const results: PublishResult[] = [];

    for (const copy of ctx.copies) {
      const score = ctx.qualityScores?.[copy.platform];
      if (score && !score.approved) {
        results.push({
          platform: copy.platform,
          success: false,
          error: `Quality score ${score.overall} below threshold (flags: ${score.flags.join(', ')})`,
          publishedAt: new Date(),
          stub: false,
        });
        continue;
      }

      const adapter = this.adapters.get(copy.platform);
      if (!adapter) {
        results.push({
          platform: copy.platform,
          success: false,
          error: `No adapter registered for platform ${copy.platform}`,
          publishedAt: new Date(),
          stub: false,
        });
        continue;
      }

      const assets = ctx.mediaAssets?.filter((a) => a.platform === copy.platform) ?? [];
      const result = await adapter.publish({
        copy,
        assets,
        brief: ctx.brief,
        campaignId: ctx.campaignId,
      });
      results.push(result);

      await db
        .update(campaignPosts)
        .set({
          publishResult: result as unknown as Record<string, unknown>,
          status: result.success ? 'published' : 'failed',
          updatedAt: new Date(),
        })
        .where(eq(campaignPosts.platform, copy.platform));
    }

    ctx.publishResults = results;
  }
}
