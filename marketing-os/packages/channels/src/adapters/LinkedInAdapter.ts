import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class LinkedInAdapter extends BaseChannelAdapter {
  readonly platform = 'linkedin' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use LinkedIn UGC Posts API
    console.log(`[LinkedIn] Posting article/post for ${payload.brief.brand}`);
    return this.stubResult('linkedin');
  }
}
