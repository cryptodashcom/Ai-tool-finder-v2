import { NextRequest, NextResponse } from 'next/server';
import { getDatasetItems, type AIAgentItem } from '@/lib/apify';

export const runtime = 'nodejs';

/**
 * GET /api/apify/results/:datasetId
 *
 * Fetch scraped AI agent items from an Apify dataset.
 *
 * Query params:
 *   limit   — max items to return (default 200, max 1000)
 *   offset  — pagination offset (default 0)
 *   format  — "json" (default) or "agentsdash" (normalised for AgentsDash.ai)
 *
 * Response:
 *   { items, total, offset, limit, datasetId }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { datasetId: string } }
) {
  const { datasetId } = params;

  if (!datasetId) {
    return NextResponse.json({ error: 'datasetId is required' }, { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 1000);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const format = searchParams.get('format') ?? 'json';

  try {
    const page = await getDatasetItems<AIAgentItem>(datasetId, { limit, offset });

    const items =
      format === 'agentsdash'
        ? page.items.map(normalizeForAgentsDash)
        : page.items;

    return NextResponse.json({
      datasetId,
      total: page.total,
      offset: page.offset,
      limit: page.limit,
      count: items.length,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Normalise raw Apify item → AgentsDash submission shape ──────────────────

function normalizeForAgentsDash(item: AIAgentItem) {
  return {
    name: item.name ?? '',
    slug: slugify(item.name ?? ''),
    websiteUrl: item.url ?? '',
    shortDescription: item.description?.slice(0, 200) ?? '',
    description: item.description ?? '',
    thumbnailUrl: item.imageUrl ?? '',
    category: item.category ?? 'AI Agent',
    tags: item.tags ?? [],
    pricing: item.pricing ?? 'Unknown',
    status: 'pending',
    source: 'apify-scraper',
    sourceUrl: item.foundAt ?? '',
    scrapedAt: item.scrapedAt,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
