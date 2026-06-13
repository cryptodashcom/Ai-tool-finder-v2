import type { MediaRequest, MediaAsset, PipelineContext, Platform } from '@marketing-os/core';
import type { Db } from '@marketing-os/core';
import type { StageHandler } from '@marketing-os/core';

import { BaseAgent } from './BaseAgent.js';

const PLATFORM_DIMENSIONS: Record<Platform, { width: number; height: number }> = {
  twitter: { width: 1200, height: 675 },
  linkedin: { width: 1200, height: 627 },
  facebook: { width: 1200, height: 630 },
  instagram: { width: 1080, height: 1080 },
  tiktok: { width: 1080, height: 1920 },
  youtube: { width: 1280, height: 720 },
  pinterest: { width: 1000, height: 1500 },
  email: { width: 600, height: 400 },
  sms: { width: 800, height: 400 },
  'google-ads': { width: 1200, height: 628 },
  blog: { width: 1200, height: 630 },
};

interface MediaRequestOutput {
  requests: Array<{
    platform: string;
    type: 'image' | 'video' | 'gif';
    prompt: string;
    style: string;
  }>;
}

export class MediaAgent extends BaseAgent implements StageHandler {
  name = 'media' as const;

  async run(ctx: PipelineContext, _db: Db): Promise<void> {
    if (!ctx.copies) throw new Error('Copy must run before MediaAgent');

    const result = await this.callWithTool<MediaRequestOutput>(
      `You are a creative director. Specify media assets that will maximize platform performance.
Generate concise, vivid image/video prompts suitable for AI image generation.`,
      `Generate media requests for this campaign:
BRIEF: ${JSON.stringify(ctx.brief, null, 2)}
PLATFORMS: ${ctx.brief.platforms.join(', ')}
POSITIONING: ${ctx.strategy?.positioning ?? ''}`,
      'specify_media',
      'Return media asset specifications for each platform',
      {
        type: 'object',
        properties: {
          requests: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                type: { type: 'string', enum: ['image', 'video', 'gif'] },
                prompt: { type: 'string', description: 'AI image generation prompt' },
                style: { type: 'string' },
              },
              required: ['platform', 'type', 'prompt', 'style'],
            },
          },
        },
        required: ['requests'],
      },
    );

    ctx.mediaRequests = result.requests.map((r) => ({
      type: r.type,
      platform: r.platform as Platform,
      prompt: r.prompt,
      dimensions: PLATFORM_DIMENSIONS[r.platform as Platform] ?? { width: 1200, height: 630 },
      style: r.style,
    }));

    // Stub: generate placeholder asset URLs (real implementation would call DALL-E / Stable Diffusion)
    ctx.mediaAssets = ctx.mediaRequests.map((req) => ({
      id: crypto.randomUUID(),
      type: req.type,
      url: `https://placehold.co/${req.dimensions.width}x${req.dimensions.height}?text=${encodeURIComponent(req.platform)}`,
      platform: req.platform,
      mimeType: req.type === 'video' ? 'video/mp4' : 'image/png',
      width: req.dimensions.width,
      height: req.dimensions.height,
      stub: true,
    }));
  }
}
