import type { QualityScore, PipelineContext, Platform } from '@marketing-os/core';
import type { Db } from '@marketing-os/core';
import type { StageHandler } from '@marketing-os/core';
import { eq } from 'drizzle-orm';
import { campaignPosts } from '@marketing-os/core';
import { BaseAgent } from './BaseAgent.js';

interface ScoreOutput {
  scores: Array<{
    platform: string;
    overall: number;
    breakdown: {
      clarity: number;
      engagement: number;
      brandAlignment: number;
      platformFit: number;
      compliance: number;
    };
    flags: string[];
    suggestions: string[];
    approved: boolean;
  }>;
}

export class QualityScoreAgent extends BaseAgent implements StageHandler {
  name = 'quality-score' as const;

  async run(ctx: PipelineContext, db: Db): Promise<void> {
    if (!ctx.copies) throw new Error('Copy must run before QualityScoreAgent');

    const result = await this.callWithTool<ScoreOutput>(
      `You are a marketing quality assurance expert. Score content rigorously on a 0-100 scale.
Be strict about platform character limits, brand safety, and clarity of the call to action.
Approve only content scoring >= 70 overall with no critical flags.`,
      `Score this campaign content:
BRIEF: ${JSON.stringify(ctx.brief, null, 2)}
STRATEGY: ${JSON.stringify(ctx.strategy, null, 2)}
COPIES: ${JSON.stringify(ctx.copies, null, 2)}`,
      'score_content',
      'Return quality scores for each platform copy',
      {
        type: 'object',
        properties: {
          scores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                overall: { type: 'number', minimum: 0, maximum: 100 },
                breakdown: {
                  type: 'object',
                  properties: {
                    clarity: { type: 'number' },
                    engagement: { type: 'number' },
                    brandAlignment: { type: 'number' },
                    platformFit: { type: 'number' },
                    compliance: { type: 'number' },
                  },
                  required: ['clarity', 'engagement', 'brandAlignment', 'platformFit', 'compliance'],
                },
                flags: { type: 'array', items: { type: 'string' } },
                suggestions: { type: 'array', items: { type: 'string' } },
                approved: { type: 'boolean' },
              },
              required: ['platform', 'overall', 'breakdown', 'flags', 'suggestions', 'approved'],
            },
          },
        },
        required: ['scores'],
      },
      6000,
    );

    ctx.qualityScores = {};
    for (const score of result.scores) {
      ctx.qualityScores[score.platform as Platform] = {
        overall: score.overall,
        breakdown: score.breakdown,
        flags: score.flags,
        suggestions: score.suggestions,
        approved: score.approved,
      };

      await db
        .update(campaignPosts)
        .set({
          qualityScore: score as unknown as Record<string, unknown>,
          status: score.approved ? 'approved' : 'draft',
          updatedAt: new Date(),
        })
        .where(eq(campaignPosts.platform, score.platform));
    }
  }
}
