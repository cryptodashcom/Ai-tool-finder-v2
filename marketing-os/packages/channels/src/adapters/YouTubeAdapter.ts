import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class YouTubeAdapter extends BaseChannelAdapter {
  readonly platform = 'youtube' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use YouTube Data API v3 videos.insert
    console.log(`[YouTube] Uploading video for ${payload.brief.brand}`);
    return this.stubResult('youtube');
  }
}
