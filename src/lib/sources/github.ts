import { DiscoveredAgent } from '../types';

const TOPICS = ['ai-agent', 'autonomous-agent', 'llm-agent'];

export async function discoverFromGitHub(): Promise<DiscoveredAgent[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');

  const seen = new Set<string>();
  const results: DiscoveredAgent[] = [];

  for (const topic of TOPICS) {
    const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=updated&per_page=8`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) continue;
    const data = await res.json() as any;

    for (const repo of data.items ?? []) {
      if (seen.has(repo.html_url)) continue;
      seen.add(repo.html_url);
      results.push({
        name: repo.name,
        url: repo.html_url,
        description: repo.description ?? '',
        source: 'github',
        rawData: repo,
      });
    }
  }

  return results;
}
