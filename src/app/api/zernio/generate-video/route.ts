import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVideoAsync } from '@/lib/zernio/video-service';
import { requireEnv } from '@/lib/env';
import type { VideoGenerationParams } from '@/lib/zernio/types';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let apiToken: string;
  try {
    apiToken = requireEnv('REPLICATE_API_TOKEN');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const body = (await req.json()) as VideoGenerationParams;
  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const { predictionId, status } = await generateVideoAsync(body, apiToken);

  return NextResponse.json({ jobId: predictionId, status });
}
