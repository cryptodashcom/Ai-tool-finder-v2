import Replicate from 'replicate';
import type { ImageGenerationParams, GenerateImageResponse } from './types';

const STYLE_PREFIXES: Record<string, string> = {
  photorealistic: 'photorealistic, hyperrealistic, highly detailed photography, ',
  illustration: 'digital illustration, artistic, detailed artwork, ',
  'digital-art': 'digital art, concept art, vibrant colors, detailed, ',
  cinematic: 'cinematic film still, dramatic lighting, movie quality, ',
};

export async function generateImage(
  params: ImageGenerationParams,
  apiToken: string
): Promise<GenerateImageResponse> {
  const replicate = new Replicate({ auth: apiToken });

  const prefix = params.style ? STYLE_PREFIXES[params.style] : '';
  const prompt = `${prefix}${params.prompt}`;

  try {
    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt,
        negative_prompt: params.negativePrompt ?? 'blurry, low quality, distorted, ugly, bad anatomy',
        width: params.width ?? 1024,
        height: params.height ?? 1024,
        num_outputs: params.numOutputs ?? 1,
        num_inference_steps: 4,
      },
    }) as string[];

    const outputs = Array.isArray(output) ? output : [output as unknown as string];

    return { jobId: `img_${Date.now()}`, status: 'completed', outputs };
  } catch (error) {
    return {
      jobId: `img_${Date.now()}`,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Image generation failed',
    };
  }
}

export async function generateImageAsync(
  params: ImageGenerationParams,
  apiToken: string
): Promise<{ predictionId: string; status: string }> {
  const replicate = new Replicate({ auth: apiToken });

  const prefix = params.style ? STYLE_PREFIXES[params.style] : '';
  const prompt = `${prefix}${params.prompt}`;

  const prediction = await replicate.predictions.create({
    model: 'black-forest-labs/flux-schnell',
    input: {
      prompt,
      negative_prompt: params.negativePrompt ?? 'blurry, low quality, distorted',
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      num_outputs: params.numOutputs ?? 1,
      num_inference_steps: 4,
    },
  });

  return { predictionId: prediction.id, status: prediction.status };
}
