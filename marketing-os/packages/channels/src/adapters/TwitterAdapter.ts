import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class TwitterAdapter extends BaseChannelAdapter {
  readonly platform = 'twitter' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use Twitter API v2 POST /2/tweets
    const charLimit = 280;
    const text = payload.copy.body.substring(0, charLimit);
    console.log(`[Twitter] Posting (${text.length} chars): ${text.substring(0, 80)}...`);
    return this.stubResult('twitter');
  }

  async validate(payload: PublishPayload) {
    const errors: string[] = [];
    if (payload.copy.body.length > 280) errors.push('Tweet exceeds 280 characters');
    return { valid: errors.length === 0, errors };
  }
}
