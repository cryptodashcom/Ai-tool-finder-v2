import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class GoogleAdsAdapter extends BaseChannelAdapter {
  readonly platform = 'google-ads' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl uses Google Ads API to create responsive search ads
    console.log(`[Google Ads] Creating ad campaign for ${payload.brief.brand}`);
    return this.stubResult('google-ads');
  }
}
