export type Platform = 'twitter' | 'linkedin' | 'facebook';

export interface PlatformConfig {
  id: Platform;
  label: string;
  maxChars: number;
  supportsVideo: boolean;
  aspectRatio: '1:1' | '16:9' | '4:5';
}

export const PLATFORMS: PlatformConfig[] = [
  { id: 'twitter', label: 'X / Twitter', maxChars: 280, supportsVideo: true, aspectRatio: '16:9' },
  { id: 'linkedin', label: 'LinkedIn', maxChars: 3000, supportsVideo: true, aspectRatio: '1:1' },
  { id: 'facebook', label: 'Facebook', maxChars: 63206, supportsVideo: true, aspectRatio: '16:9' },
];

export interface ScheduledPost {
  id?: string;
  platforms: Platform[];
  caption: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | null;
  scheduledAt: string; // ISO string
  status: 'draft' | 'scheduled' | 'published';
}
