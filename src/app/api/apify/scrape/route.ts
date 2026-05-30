import { NextRequest, NextResponse } from 'next/server';
import { runActor, SCRAPER_PRESETS, type ScraperPreset } from '@/lib/apify';

export const runtime = 'nodejs';

/**
 * POST /api/apify/scrape
 *
 * Start an AI agent scraping run.
 *
 * Body (JSON):
 *   preset   — one of "theresAnAiForThat" | "futurepedia" | "productHunt" | "custom"
 *   urls     — (only for preset="custom") array of URLs to scrape
 *   memory   — optional Apify memory in MB (default 1024)
 *
 * Returns:
 *   { runId, datasetId, status, startedAt }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { preset = 'theresAnAiForThat', urls, memory } = body as {
      preset?: ScraperPreset | 'custom';
      urls?: string[];
      memory?: number;
    };

    let actorId: string;
    let input: Record<string, unknown>;

    if (preset === 'custom') {
      if (!Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json(
          { error: 'Provide at least one URL in the "urls" array when using preset="custom"' },
          { status: 400 }
        );
      }
      const config = SCRAPER_PRESETS.custom(urls);
      actorId = config.actorId;
      input = config.input as unknown as Record<string, unknown>;
    } else {
      const validPresets = ['theresAnAiForThat', 'futurepedia', 'productHunt'] as const;
      if (!validPresets.includes(preset as (typeof validPresets)[number])) {
        return NextResponse.json(
          { error: `Invalid preset. Choose one of: ${validPresets.join(', ')}, custom` },
          { status: 400 }
        );
      }
      const config = SCRAPER_PRESETS[preset as Exclude<ScraperPreset, 'custom'>];
      actorId = config.actorId;
      input = config.input as unknown as Record<string, unknown>;
    }

    const run = await runActor({ actorId, input, memory });

    return NextResponse.json({
      runId: run.id,
      datasetId: run.defaultDatasetId,
      status: run.status,
      startedAt: run.startedAt,
      statusUrl: `/api/apify/scrape/${run.id}`,
      resultsUrl: `/api/apify/results/${run.defaultDatasetId}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/apify/scrape
 *
 * Returns available scraper presets and usage instructions.
 */
export async function GET() {
  return NextResponse.json({
    presets: [
      {
        id: 'theresAnAiForThat',
        label: "There's An AI For That",
        description: 'Scrapes AI agent listings from theresanaiforthat.com',
        source: 'https://theresanaiforthat.com/ai-agents/',
      },
      {
        id: 'futurepedia',
        label: 'Futurepedia',
        description: 'Scrapes AI agents and productivity tools from futurepedia.io',
        source: 'https://www.futurepedia.io/ai-tools?category=ai-agents',
      },
      {
        id: 'productHunt',
        label: 'ProductHunt AI',
        description: 'Scrapes AI-related product launches from ProductHunt',
        source: 'https://www.producthunt.com/topics/artificial-intelligence',
      },
      {
        id: 'custom',
        label: 'Custom URLs',
        description: 'Scrape any AI tool directory — pass your own "urls" array',
        source: null,
      },
    ],
    usage: {
      start: 'POST /api/apify/scrape  { "preset": "futurepedia" }',
      status: 'GET  /api/apify/scrape/:runId',
      results: 'GET  /api/apify/results/:datasetId',
    },
  });
}
