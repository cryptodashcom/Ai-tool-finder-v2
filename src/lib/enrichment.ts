import { DiscoveredAgent, EnrichedAgent } from './types';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const CATEGORIES = ['Coding', 'Research', 'Data', 'Marketing', 'Sales', 'Legal', 'Productivity', 'DevOps', 'Other'] as const;
const BATCH_SIZE = 5;

async function claudeEnrichBatch(agents: DiscoveredAgent[]): Promise<Omit<EnrichedAgent, keyof DiscoveredAgent>[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');

  const prompt = `You are enriching AI agent listings for AgentsDash.ai — a directory of AI agents and tools.

Analyze each listing and return a JSON array. One object per agent, in the same order.

Categories: ${CATEGORIES.join(', ')}

Agents to enrich:
${agents.map((a, i) => `[${i}]
Name: ${a.name}
Source: ${a.source}
URL: ${a.url}
Description: ${a.description.slice(0, 400)}`).join('\n\n')}

Return ONLY a JSON array with ${agents.length} objects:
[
  {
    "category": "one of the categories above",
    "tags": ["tag1", "tag2", "tag3"],
    "pricing": "free|freemium|paid|unknown",
    "enrichedDescription": "clean 1-2 sentence description for the directory",
    "isAiAgent": true or false
  }
]`;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json() as any;
  const text: string = data.content?.find((b: any) => b.type === 'text')?.text ?? '[]';

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Claude returned no JSON array');
  return JSON.parse(jsonMatch[0]);
}

export async function enrichAgents(agents: DiscoveredAgent[]): Promise<EnrichedAgent[]> {
  const enriched: EnrichedAgent[] = [];

  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE);
    try {
      const results = await claudeEnrichBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        const r = results[j] ?? {};
        enriched.push({
          ...batch[j],
          category: r.category ?? 'Other',
          tags: r.tags ?? [],
          pricing: r.pricing ?? 'unknown',
          enrichedDescription: r.enrichedDescription ?? batch[j].description.slice(0, 200),
          isAiAgent: r.isAiAgent ?? true,
        });
      }
    } catch (e) {
      // Fall back to raw data for this batch
      for (const agent of batch) {
        enriched.push({
          ...agent,
          category: 'Other',
          tags: [],
          pricing: 'unknown',
          enrichedDescription: agent.description.slice(0, 200),
          isAiAgent: true,
        });
      }
    }
  }

  return enriched;
}
