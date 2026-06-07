import Replicate from 'replicate';
import type { VideoGenerationParams } from './types';

const ASPECT_SIZES: Record<string, string> = {
  '16:9': '848*480',
  '9:16': '480*848',
  '1:1': '480*480',
};

export async function generateVideoAsync(
  params: VideoGenerationParams,
  apiToken: string
): Promise<{ predictionId: string; status: string }> {
  const replicate = new Replicate({ auth: apiToken });

  const size = ASPECT_SIZES[params.aspectRatio ?? '16:9'];
  const numFrames = Math.round((params.duration ?? 5) * (params.fps ?? 16));

  const prediction = await replicate.predictions.create({
    model: 'wan-ai/wan2.1-t2v-480p',
    input: {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt ?? 'low quality, blurry, distorted, static, noisy',
      num_frames: numFrames,
      sample_guide_scale: 5,
      sample_steps: 30,
      fast_mode: 'Balanced',
      size,
    },
  });

  return { predictionId: prediction.id, status: prediction.status };
}

export async function checkPredictionStatus(
  predictionId: string,
  apiToken: string
): Promise<{ status: string; outputs?: string[]; error?: string }> {
  const replicate = new Replicate({ auth: apiToken });
  const prediction = await replicate.predictions.get(predictionId);

  const outputs = prediction.output
    ? Array.isArray(prediction.output)
      ? (prediction.output as string[])
      : [prediction.output as string]
    : undefined;

  return { status: prediction.status, outputs, error: prediction.error as string | undefined };
}
