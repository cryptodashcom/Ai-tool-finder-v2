export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'email'
  | 'sms'
  | 'google-ads'
  | 'blog';

export const ALL_PLATFORMS: Platform[] = [
  'twitter', 'linkedin', 'facebook', 'instagram', 'tiktok',
  'youtube', 'pinterest', 'email', 'sms', 'google-ads', 'blog',
];

export type CampaignStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused';

export type PostStatus = 'draft' | 'scored' | 'approved' | 'published' | 'failed';

export interface CampaignBrief {
  brand: string;
  product: string;
  objective: 'awareness' | 'engagement' | 'conversion' | 'retention';
  targetAudience: string;
  keyMessages: string[];
  tone: string;
  platforms: Platform[];
  budget?: number;
  startDate?: string;
  endDate?: string;
  additionalContext?: string;
}

export interface MessagingFramework {
  primaryMessage: string;
  supportingPoints: string[];
  callToAction: string;
}

export interface PlatformGuidance {
  angle: string;
  contentType: string;
  postingFrequency: string;
  characterLimit?: number;
}

export interface CampaignStrategy {
  campaignId: string;
  positioning: string;
  messagingFramework: MessagingFramework;
  platformGuidance: Partial<Record<Platform, PlatformGuidance>>;
  hashtags: string[];
  createdAt: Date;
}

export interface PlatformCopy {
  platform: Platform;
  headline?: string;
  body: string;
  cta?: string;
  hashtags?: string[];
  characterCount: number;
}

export interface MediaRequest {
  type: 'image' | 'video' | 'gif';
  platform: Platform;
  prompt: string;
  dimensions: { width: number; height: number };
  style?: string;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  platform: Platform;
  mimeType: string;
  width: number;
  height: number;
  stub: boolean;
}

export interface QualityScoreBreakdown {
  clarity: number;
  engagement: number;
  brandAlignment: number;
  platformFit: number;
  compliance: number;
}

export interface QualityScore {
  overall: number;
  breakdown: QualityScoreBreakdown;
  flags: string[];
  suggestions: string[];
  approved: boolean;
}

export interface PublishResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  publishedAt: Date;
  stub: boolean;
}

export interface PipelineContext {
  campaignId: string;
  brief: CampaignBrief;
  strategy?: CampaignStrategy;
  copies?: PlatformCopy[];
  mediaRequests?: MediaRequest[];
  mediaAssets?: MediaAsset[];
  qualityScores?: Partial<Record<Platform, QualityScore>>;
  publishResults?: PublishResult[];
  errors: Array<{ stage: string; error: string; timestamp: Date }>;
  startedAt: Date;
  completedAt?: Date;
  status: CampaignStatus;
}

export type PipelineStage =
  | 'brief'
  | 'strategy'
  | 'copy'
  | 'media'
  | 'quality-score'
  | 'publish';

export type AuditLevel = 'info' | 'warn' | 'error';
