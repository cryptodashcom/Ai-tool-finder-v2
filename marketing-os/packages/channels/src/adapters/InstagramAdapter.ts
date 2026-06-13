import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class InstagramAdapter extends BaseChannelAdapter {
  readonly platform = 'instagram' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use Instagram Graph API (media container + publish)
    console.log(`[Instagram] Publishing media for ${payload.brief.brand}`);
    return this.stubResult('instagram');
  }
}
