export type MediaType = 'image' | 'video';
export type GenerationStatus = 'pending' | 'starting' | 'processing' | 'completed' | 'failed';

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: 'photorealistic' | 'illustration' | 'digital-art' | 'cinematic';
  numOutputs?: number;
}

export interface VideoGenerationParams {
  prompt: string;
  negativePrompt?: string;
  duration?: number;
  fps?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface GenerationJob {
  jobId: string;
  type: MediaType;
  status: GenerationStatus;
  prompt: string;
  outputs?: string[];
  cloudinaryUrls?: string[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface GenerateImageResponse {
  jobId: string;
  status: GenerationStatus;
  outputs?: string[];
  cloudinaryUrls?: string[];
  error?: string;
}

export interface GenerateVideoResponse {
  jobId: string;
  status: string;
  outputs?: string[];
  cloudinaryUrls?: string[];
  error?: string;
}
