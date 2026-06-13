import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class FacebookAdapter extends BaseChannelAdapter {
  readonly platform = 'facebook' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use Facebook Graph API /me/feed
    console.log(`[Facebook] Posting to page for ${payload.brief.brand}`);
    return this.stubResult('facebook');
  }
}
