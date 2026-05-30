import { NextRequest, NextResponse } from 'next/server';
import { getRunStatus } from '@/lib/apify';

export const runtime = 'nodejs';

/**
 * GET /api/apify/scrape/:runId
 *
 * Returns the current status of an Apify scraping run.
 *
 * Response includes:
 *   runId, status, startedAt, finishedAt?,
 *   datasetId, resultsUrl, durationMs?
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const { runId } = params;

  if (!runId) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  try {
    const run = await getRunStatus(runId);

    const done = run.status === 'SUCCEEDED' || run.status === 'FAILED' ||
      run.status === 'TIMED-OUT' || run.status === 'ABORTED';

    return NextResponse.json({
      runId: run.id,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt ?? null,
      durationMs: run.stats?.durationMillis ?? null,
      datasetId: run.defaultDatasetId,
      done,
      ...(done && run.status === 'SUCCEEDED'
        ? { resultsUrl: `/api/apify/results/${run.defaultDatasetId}` }
        : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
