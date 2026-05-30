const APIFY_BASE_URL = 'https://api.apify.com/v2';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RunStatus =
  | 'READY'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMING-OUT'
  | 'TIMED-OUT'
  | 'ABORTING'
  | 'ABORTED';

export interface ApifyRun {
  id: string;
  actId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  defaultDatasetId: string;
  defaultKeyValueStoreId: string;
  stats?: {
    inputBodyLen: number;
    rebootCount: number;
    durationMillis?: number;
  };
}

export interface ApifyDatasetPage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface AIAgentItem {
  name: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
  pricing?: string;
  imageUrl?: string;
  foundAt: string;
  scrapedAt: string;
}

export interface RunActorParams {
  actorId: string;
  input: Record<string, unknown>;
  memory?: number;
  timeoutSecs?: number;
}

// ─── Token helper ─────────────────────────────────────────────────────────────

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN is not set');
  return token;
}

// ─── Core API calls ───────────────────────────────────────────────────────────

export async function runActor(params: RunActorParams): Promise<ApifyRun> {
  const { actorId, input, memory = 1024, timeoutSecs = 600 } = params;
  const token = getToken();

  const res = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, memory, timeoutSecs }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify run failed [${res.status}]: ${body}`);
  }

  const json = await res.json();
  return json.data as ApifyRun;
}

export async function getRunStatus(runId: string): Promise<ApifyRun> {
  const token = getToken();

  const res = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch run [${res.status}]`);
  }

  const json = await res.json();
  return json.data as ApifyRun;
}

export async function getDatasetItems<T = AIAgentItem>(
  datasetId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ApifyDatasetPage<T>> {
  const { limit = 200, offset = 0 } = options;
  const token = getToken();

  const url = new URL(`${APIFY_BASE_URL}/datasets/${datasetId}/items`);
  url.searchParams.set('token', token);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('clean', 'true');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Failed to fetch dataset [${res.status}]`);
  }

  const items = (await res.json()) as T[];
  const total = parseInt(res.headers.get('x-apify-pagination-total') ?? '0', 10);

  return { items, total, offset, limit };
}

// ─── Pre-built scraper configs for AI agents ──────────────────────────────────

export const SCRAPER_PRESETS = {
  /**
   * Scrapes "There's An AI For That" AI agent listings.
   * Uses apify/cheerio-scraper — fast HTML parser, no JS rendering needed.
   */
  theresAnAiForThat: {
    actorId: 'apify/cheerio-scraper',
    input: {
      startUrls: [{ url: 'https://theresanaiforthat.com/ai-agents/' }],
      pageFunction: /* js */ `async function pageFunction({ $, request, enqueueRequest }) {
        const agents = [];

        // Collect links to agent detail pages for deeper scraping
        $('a[href*="/ai/"]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const full = href.startsWith('http') ? href : 'https://theresanaiforthat.com' + href;
          enqueueRequest({ url: full });
        });

        // Parse listing cards
        $('[class*="ai-"], article, .tool').each((_, el) => {
          const $el = $(el);
          const name = $el.find('h2, h3, [class*="name"], [class*="title"]').first().text().trim();
          const description = $el.find('p, [class*="desc"]').first().text().trim();
          const link = $el.find('a').first().attr('href') || '';
          const image = $el.find('img').first().attr('src') || '';

          if (name && link) {
            agents.push({
              name,
              description,
              url: link.startsWith('http') ? link : 'https://theresanaiforthat.com' + link,
              imageUrl: image,
              category: 'AI Agent',
              foundAt: request.url,
              scrapedAt: new Date().toISOString(),
            });
          }
        });

        return agents;
      }`,
      maxRequestsPerCrawl: 100,
      maxConcurrency: 5,
    },
  },

  /**
   * Scrapes Futurepedia AI agent and assistant tools.
   * Uses apify/web-scraper — handles JS-rendered pages.
   */
  futurepedia: {
    actorId: 'apify/web-scraper',
    input: {
      startUrls: [
        { url: 'https://www.futurepedia.io/ai-tools?category=ai-agents' },
        { url: 'https://www.futurepedia.io/ai-tools?category=productivity' },
      ],
      pageFunction: /* js */ `async function pageFunction({ $, request, log }) {
        const tools = [];

        $('article, [data-tool], .tool-card, .grid > div').each((_, el) => {
          const $el = $(el);
          const name = $el.find('h2, h3, .font-bold, [class*="title"]').first().text().trim();
          const description = $el.find('p, [class*="desc"], [class*="tagline"]').first().text().trim();
          const link = $el.find('a[href]').first().attr('href') || '';
          const image = $el.find('img').first().attr('src') || '';
          const tags = [];

          $el.find('[class*="tag"], [class*="badge"], [class*="category"]').each((_, t) => {
            const tag = $(t).text().trim();
            if (tag) tags.push(tag);
          });

          if (name) {
            tools.push({
              name,
              description,
              url: link.startsWith('http') ? link : 'https://www.futurepedia.io' + link,
              imageUrl: image,
              tags,
              foundAt: request.url,
              scrapedAt: new Date().toISOString(),
            });
          }
        });

        log.info('Found ' + tools.length + ' tools on ' + request.url);
        return tools;
      }`,
      pseudoUrls: ['https://www.futurepedia.io/tool/[.*]'],
      maxRequestsPerCrawl: 80,
      maxConcurrency: 5,
    },
  },

  /**
   * Scrapes ProductHunt AI-related launches.
   * Uses apify/web-scraper for JS rendering.
   */
  productHunt: {
    actorId: 'apify/web-scraper',
    input: {
      startUrls: [
        { url: 'https://www.producthunt.com/topics/artificial-intelligence' },
      ],
      pageFunction: /* js */ `async function pageFunction({ $, request, log }) {
        const tools = [];

        $('[data-test="post-item"], .styles_item__[a-z0-9]+, li[class*="post"]').each((_, el) => {
          const $el = $(el);
          const name = $el.find('strong, h3, [class*="name"]').first().text().trim();
          const description = $el.find('[class*="tagline"], p').first().text().trim();
          const link = $el.find('a[href*="/posts/"]').first().attr('href') || '';
          const image = $el.find('img').first().attr('src') || '';

          if (name && link) {
            tools.push({
              name,
              description,
              url: link.startsWith('http') ? link : 'https://www.producthunt.com' + link,
              imageUrl: image,
              category: 'AI Tool',
              foundAt: request.url,
              scrapedAt: new Date().toISOString(),
            });
          }
        });

        log.info('Found ' + tools.length + ' tools on ' + request.url);
        return tools;
      }`,
      maxRequestsPerCrawl: 50,
      maxConcurrency: 3,
    },
  },

  /**
   * Generic scraper — provide your own startUrls and it will extract
   * tool cards from any AI directory page.
   */
  custom: (startUrls: string[]) => ({
    actorId: 'apify/web-scraper',
    input: {
      startUrls: startUrls.map((url) => ({ url })),
      pageFunction: /* js */ `async function pageFunction({ $, request }) {
        const tools = [];

        $('article, .card, [class*="tool"], [class*="agent"], [class*="product"]').each((_, el) => {
          const $el = $(el);
          const name = $el.find('h1, h2, h3, [class*="name"], [class*="title"]').first().text().trim();
          const description = $el.find('p, [class*="desc"]').first().text().trim();
          const link = $el.find('a').first().attr('href') || '';
          const image = $el.find('img').first().attr('src') || '';

          if (name) {
            tools.push({
              name,
              description,
              url: link.startsWith('http') ? link : new URL(link, request.url).href,
              imageUrl: image,
              foundAt: request.url,
              scrapedAt: new Date().toISOString(),
            });
          }
        });

        return tools;
      }`,
      maxRequestsPerCrawl: 100,
      maxConcurrency: 5,
    },
  }),
} as const;

export type ScraperPreset = keyof typeof SCRAPER_PRESETS;
