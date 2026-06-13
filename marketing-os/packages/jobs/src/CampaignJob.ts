import type { CampaignBrief, Platform, PipelineContext } from '@marketing-os/core';
import { createDb, Pipeline } from '@marketing-os/core';
import {
  BriefAgent,
  StrategyAgent,
  CopyAgent,
  MediaAgent,
  QualityScoreAgent,
  PublishAgent,
} from '@marketing-os/agents';
import {
  TwitterAdapter,
  LinkedInAdapter,
  FacebookAdapter,
  InstagramAdapter,
  TikTokAdapter,
  YouTubeAdapter,
  PinterestAdapter,
  EmailAdapter,
  SMSAdapter,
  GoogleAdsAdapter,
  BlogAdapter,
} from '@marketing-os/channels';
import type { ChannelAdapter } from '@marketing-os/channels';

function buildAdapters(): Map<Platform, ChannelAdapter> {
  const adapters = [
    new TwitterAdapter(),
    new LinkedInAdapter(),
    new FacebookAdapter(),
    new InstagramAdapter(),
    new TikTokAdapter(),
    new YouTubeAdapter(),
    new PinterestAdapter(),
    new EmailAdapter(),
    new SMSAdapter(),
    new GoogleAdsAdapter(),
    new BlogAdapter(),
  ];
  const map = new Map<Platform, ChannelAdapter>();
  for (const a of adapters) map.set(a.platform, a);
  return map;
}

export async function runCampaignJob(brief: CampaignBrief, dbPath?: string): Promise<PipelineContext> {
  const db = createDb(dbPath);
  const adapters = buildAdapters();

  const pipeline = new Pipeline(db)
    .use(new BriefAgent())
    .use(new StrategyAgent())
    .use(new CopyAgent())
    .use(new MediaAgent())
    .use(new QualityScoreAgent())
    .use(new PublishAgent(adapters));

  return pipeline.run(brief);
}
