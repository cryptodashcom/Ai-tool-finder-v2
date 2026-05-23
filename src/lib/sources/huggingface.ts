import { DiscoveredAgent } from '../types';

export async function discoverFromHuggingFace(): Promise<DiscoveredAgent[]> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) throw new Error('HUGGINGFACE_API_KEY not set');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const [spacesRes, modelsRes] = await Promise.allSettled([
    fetch('https://huggingface.co/api/spaces?search=ai+agent&sort=likes&direction=-1&limit=12', {
      headers,
      signal: AbortSignal.timeout(15000),
    }),
    fetch('https://huggingface.co/api/models?search=agent&sort=downloads&limit=8&filter=pipeline_tag:text-generation', {
      headers,
      signal: AbortSignal.timeout(15000),
    }),
  ]);

  const results: DiscoveredAgent[] = [];

  if (spacesRes.status === 'fulfilled' && spacesRes.value.ok) {
    const spaces = await spacesRes.value.json() as any[];
    for (const s of spaces) {
      results.push({
        name: (s.id as string).split('/').pop() ?? s.id,
        url: `https://huggingface.co/spaces/${s.id}`,
        description: s.cardData?.short_description ?? s.id,
        source: 'huggingface',
        rawData: s,
      });
    }
  }

  if (modelsRes.status === 'fulfilled' && modelsRes.value.ok) {
    const models = await modelsRes.value.json() as any[];
    for (const m of models) {
      results.push({
        name: (m.id as string).split('/').pop() ?? m.id,
        url: `https://huggingface.co/${m.id}`,
        description: m.cardData?.short_description ?? m.id,
        source: 'huggingface',
        rawData: m,
      });
    }
  }

  return results;
}
