import { nanoid } from 'nanoid';
import type { MediaRequest, MediaAsset } from '@marketing-os/core';
import type { GenerationProvider } from './types.js';

export class MediaGenerator {
  constructor(private readonly provider: GenerationProvider = { name: 'stub' }) {}

  async generate(request: MediaRequest): Promise<MediaAsset> {
    if (this.provider.name === 'stub') {
      return this.stubAsset(request);
    }
    throw new Error(`Provider ${this.provider.name} not yet implemented`);
  }

  async generateBatch(requests: MediaRequest[]): Promise<MediaAsset[]> {
    return Promise.all(requests.map((r) => this.generate(r)));
  }

  private stubAsset(request: MediaRequest): MediaAsset {
    const { width, height } = request.dimensions;
    return {
      id: nanoid(),
      type: request.type,
      url: `https://placehold.co/${width}x${height}?text=${encodeURIComponent(request.platform)}`,
      platform: request.platform,
      mimeType: request.type === 'video' ? 'video/mp4' : 'image/png',
      width,
      height,
      stub: true,
    };
  }
}
