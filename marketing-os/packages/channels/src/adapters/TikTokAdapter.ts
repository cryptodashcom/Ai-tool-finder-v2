import { nanoid } from 'nanoid';
import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class TikTokAdapter extends BaseChannelAdapter {
  readonly platform = 'tiktok' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl uses TikTok Content Posting API
    console.log(`[TikTok] Publishing video content for ${payload.brief.brand}`);
    return this.stubResult('tiktok', nanoid());
  }
}
