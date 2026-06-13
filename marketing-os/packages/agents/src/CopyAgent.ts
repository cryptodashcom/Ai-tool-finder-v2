import type { PlatformCopy, PipelineContext, Platform } from '@marketing-os/core';
import type { Db } from '@marketing-os/core';
import type { StageHandler } from '@marketing-os/core';

import { campaignPosts } from '@marketing-os/core';
import { BaseAgent } from './BaseAgent.js';

interface CopyOutput {
  copies: Array<{
    platform: string;
    headline?: string;
    body: string;
    cta?: string;
    hashtags?: string[];
  }>;
}

export class CopyAgent extends BaseAgent implements StageHandler {
  name = 'copy' as const;

  async run(ctx: PipelineContext, db: Db): Promise<void> {
    if (!ctx.strategy) throw new Error('Strategy must run before CopyAgent');

    const result = await this.callWithTool<CopyOutput>(
      `You are an expert copywriter. Write platform-native copy that converts.
Respect each platform's character limits and content style strictly.
Write authentic, engaging copy that matches the brand tone.`,
      `Write copy for all platforms based on:
BRIEF: ${JSON.stringify(ctx.brief, null, 2)}
STRATEGY: ${JSON.stringify(ctx.strategy, null, 2)}

Write copy for these platforms: ${ctx.brief.platforms.join(', ')}`,
      'write_copy',
      'Return copy for all requested platforms',
      {
        type: 'object',
        properties: {
          copies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                headline: { type: 'string' },
                body: { type: 'string' },
                cta: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } },
              },
              required: ['platform', 'body'],
            },
          },
        },
        required: ['copies'],
      },
      8000,
    );

    const now = new Date();
    ctx.copies = result.copies.map((c) => ({
      platform: c.platform as Platform,
      headline: c.headline,
      body: c.body,
      cta: c.cta,
      hashtags: c.hashtags,
      characterCount: c.body.length + (c.headline?.length ?? 0),
    }));

    for (const copy of ctx.copies) {
      await db.insert(campaignPosts).values({
        id: crypto.randomUUID(),
        campaignId: ctx.campaignId,
        platform: copy.platform,
        copy: copy as unknown as Record<string, unknown>,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
