import { nanoid } from 'nanoid';
import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class EmailAdapter extends BaseChannelAdapter {
  readonly platform = 'email' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl uses SendGrid / Mailchimp API to create and schedule campaign
    console.log(`[Email] Scheduling email campaign for ${payload.brief.brand}`);
    return this.stubResult('email', nanoid());
  }
}
