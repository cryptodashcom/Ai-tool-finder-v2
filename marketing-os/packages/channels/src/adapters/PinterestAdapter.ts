import { nanoid } from 'nanoid';
import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class PinterestAdapter extends BaseChannelAdapter {
  readonly platform = 'pinterest' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl uses Pinterest API v5 POST /pins
    console.log(`[Pinterest] Creating pin for ${payload.brief.brand}`);
    return this.stubResult('pinterest', nanoid());
  }
}
