import type { PublishResult, Platform, PlatformCopy, MediaAsset, CampaignBrief } from '@marketing-os/core';

export interface PublishPayload {
  campaignId: string;
  brief: CampaignBrief;
  copy: PlatformCopy;
  assets: MediaAsset[];
}

export interface ChannelAdapter {
  readonly platform: Platform;
  publish(payload: PublishPayload): Promise<PublishResult>;
  validate?(payload: PublishPayload): Promise<{ valid: boolean; errors: string[] }>;
}

export abstract class BaseChannelAdapter implements ChannelAdapter {
  abstract readonly platform: Platform;

  abstract publish(payload: PublishPayload): Promise<PublishResult>;

  async validate(payload: PublishPayload): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  protected stubResult(platform: Platform): PublishResult {
    const postId = crypto.randomUUID();
    return {
      platform,
      success: true,
      postId,
      url: `https://stub.example.com/${platform}/${postId}`,
      publishedAt: new Date(),
      stub: true,
    };
  }
}
