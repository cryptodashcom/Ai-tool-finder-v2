import { nanoid } from 'nanoid';
import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class LinkedInAdapter extends BaseChannelAdapter {
  readonly platform = 'linkedin' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl uses LinkedIn UGC Posts API
    console.log(`[LinkedIn] Posting for ${payload.brief.brand}`);
    return this.stubResult('linkedin', nanoid());
  }
}
