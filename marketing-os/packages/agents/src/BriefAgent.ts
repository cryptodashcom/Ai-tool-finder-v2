import type { CampaignBrief, PipelineContext } from '@marketing-os/core';
import type { Db } from '@marketing-os/core';
import type { StageHandler } from '@marketing-os/core';
import { BaseAgent } from './BaseAgent.js';

export class BriefAgent extends BaseAgent implements StageHandler {
  name = 'brief' as const;

  async run(ctx: PipelineContext, _db: Db): Promise<void> {
    // Validate and enrich the brief
    const enriched = await this.callWithTool<CampaignBrief>(
      `You are a senior brand strategist. Validate and enrich marketing campaign briefs.
Ensure all fields are coherent and the platforms list makes sense for the objective.`,
      `Validate and enrich this campaign brief:\n${JSON.stringify(ctx.brief, null, 2)}`,
      'enrich_brief',
      'Return the validated and lightly enriched campaign brief',
      {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          product: { type: 'string' },
          objective: { type: 'string', enum: ['awareness', 'engagement', 'conversion', 'retention'] },
          targetAudience: { type: 'string' },
          keyMessages: { type: 'array', items: { type: 'string' } },
          tone: { type: 'string' },
          platforms: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube', 'pinterest', 'email', 'sms', 'google-ads', 'blog'],
            },
          },
          budget: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          additionalContext: { type: 'string' },
        },
        required: ['brand', 'product', 'objective', 'targetAudience', 'keyMessages', 'tone', 'platforms'],
      },
    );
    ctx.brief = enriched;
  }
}
