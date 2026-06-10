import { nanoid } from 'nanoid';
import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class SMSAdapter extends BaseChannelAdapter {
  readonly platform = 'sms' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl uses Twilio Messages API
    const body = payload.copy.body.substring(0, 160);
    console.log(`[SMS] Sending message (${body.length} chars) for ${payload.brief.brand}`);
    return this.stubResult('sms', nanoid());
  }

  async validate(payload: PublishPayload) {
    const errors: string[] = [];
    if (payload.copy.body.length > 160) errors.push('SMS exceeds 160 characters');
    return { valid: errors.length === 0, errors };
  }
}
