import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class EmailAdapter extends BaseChannelAdapter {
  readonly platform = 'email' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use SendGrid / Mailchimp API to create campaign
    console.log(`[Email] Scheduling email campaign for ${payload.brief.brand}`);
    return this.stubResult('email');
  }
}
