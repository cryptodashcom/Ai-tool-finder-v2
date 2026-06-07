import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkPredictionStatus } from '@/lib/zernio/video-service';
import { uploadMediaUrls } from '@/lib/zernio/cloudinary-upload';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: 'Replicate API token not configured' }, { status: 500 });
  }

  const { jobId } = await params;
  const result = await checkPredictionStatus(jobId, apiToken);

  let cloudinaryUrls: string[] | undefined;
  if (result.status === 'succeeded' && result.outputs?.length) {
    cloudinaryUrls = await uploadMediaUrls(result.outputs, 'video');
  }

  return NextResponse.json({
    jobId,
    status: result.status === 'succeeded' ? 'completed' : result.status,
    outputs: result.outputs,
    cloudinaryUrls,
    error: result.error,
  });
}
