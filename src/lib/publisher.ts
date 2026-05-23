import { ScoredAgent } from './types';

export interface PublishResult {
  published: number;
  failed: number;
  errors: string[];
}

export async function publishAgents(agents: ScoredAgent[]): Promise<PublishResult> {
  const apiUrl = process.env.AGENTSDASH_API_URL;
  const apiKey = process.env.AGENTSDASH_API_KEY;

  if (!apiUrl || !apiKey) {
    return { published: 0, failed: 0, errors: ['AGENTSDASH_API_URL or AGENTSDASH_API_KEY not configured — skipping publish'] };
  }

  const result: PublishResult = { published: 0, failed: 0, errors: [] };

  for (const agent of agents) {
    try {
      const payload = {
        name: agent.name,
        description: agent.enrichedDescription,
        category: agent.category,
        tags: agent.tags,
        pricing: agent.pricing,
        url: agent.url,
        source: agent.source,
        score: agent.score,
        status: 'pending_review',
      };

      const res = await fetch(`${apiUrl}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        result.published++;
      } else {
        result.failed++;
        result.errors.push(`${agent.name}: HTTP ${res.status}`);
      }
    } catch (e: any) {
      result.failed++;
      result.errors.push(`${agent.name}: ${e.message}`);
    }
  }

  return result;
}
