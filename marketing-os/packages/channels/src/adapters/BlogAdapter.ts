import { BaseChannelAdapter } from '../ChannelAdapter.js';
import type { PublishPayload } from '../ChannelAdapter.js';
import type { PublishResult } from '@marketing-os/core';

export class BlogAdapter extends BaseChannelAdapter {
  readonly platform = 'blog' as const;

  async publish(payload: PublishPayload): Promise<PublishResult> {
    // STUB: real impl would use WordPress REST API or CMS API
    console.log(`[Blog] Publishing post for ${payload.brief.brand}: ${payload.copy.headline ?? 'Untitled'}`);
    return this.stubResult('blog');
  }
}
