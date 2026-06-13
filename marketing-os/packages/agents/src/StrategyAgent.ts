import type { CampaignStrategy, PipelineContext, Platform, PlatformGuidance } from '@marketing-os/core';
import type { Db } from '@marketing-os/core';
import type { StageHandler } from '@marketing-os/core';
import { BaseAgent } from './BaseAgent.js';

export class StrategyAgent extends BaseAgent implements StageHandler {
  name = 'strategy' as const;

  async run(ctx: PipelineContext, _db: Db): Promise<void> {
    const strategy = await this.callWithTool<Omit<CampaignStrategy, 'campaignId' | 'createdAt'>>(
      `You are a world-class marketing strategist. Create precise, actionable marketing strategies.
For each platform, provide guidance that respects the platform's native content style and character limits:
- twitter: 280 chars, punchy, hashtags, conversational
- linkedin: professional, thought leadership, 700 chars recommended
- facebook: community-focused, mix media, 2000 chars max
- instagram: visual-first, caption up to 2200 chars, 30 hashtags
- tiktok: trend-aware, entertainment-first, hooks in first 3s
- youtube: SEO titles, descriptions, timestamps, CTAs
- pinterest: evergreen, SEO, inspirational
- email: subject line + preheader + body, conversion-focused
- sms: 160 chars, urgent, clear CTA
- google-ads: headlines 30 chars, descriptions 90 chars, benefit-led
- blog: SEO-optimised, long-form, authoritative`,
      `Create a complete marketing strategy for this brief:\n${JSON.stringify(ctx.brief, null, 2)}`,
      'create_strategy',
      'Return a complete marketing strategy',
      {
        type: 'object',
        properties: {
          positioning: { type: 'string', description: '2-3 sentence positioning statement' },
          messagingFramework: {
            type: 'object',
            properties: {
              primaryMessage: { type: 'string' },
              supportingPoints: { type: 'array', items: { type: 'string' } },
              callToAction: { type: 'string' },
            },
            required: ['primaryMessage', 'supportingPoints', 'callToAction'],
          },
          platformGuidance: {
            type: 'object',
            description: 'Guidance for each platform in the brief',
            additionalProperties: {
              type: 'object',
              properties: {
                angle: { type: 'string' },
                contentType: { type: 'string' },
                postingFrequency: { type: 'string' },
                characterLimit: { type: 'number' },
              },
              required: ['angle', 'contentType', 'postingFrequency'],
            },
          },
          hashtags: { type: 'array', items: { type: 'string' } },
        },
        required: ['positioning', 'messagingFramework', 'platformGuidance', 'hashtags'],
      },
      6000,
    );

    ctx.strategy = {
      ...strategy,
      campaignId: ctx.campaignId,
      createdAt: new Date(),
    };
  }
}
