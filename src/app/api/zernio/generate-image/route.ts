import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateImage } from '@/lib/zernio/image-service';
import { uploadMediaUrls } from '@/lib/zernio/cloudinary-upload';
import type { ImageGenerationParams } from '@/lib/zernio/types';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: 'Replicate API token not configured' }, { status: 500 });
  }

  const body = (await req.json()) as ImageGenerationParams;
  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const result = await generateImage(body, apiToken);

  if (result.status === 'completed' && result.outputs?.length) {
    result.cloudinaryUrls = await uploadMediaUrls(result.outputs, 'image');
  }

  return NextResponse.json(result);
}
