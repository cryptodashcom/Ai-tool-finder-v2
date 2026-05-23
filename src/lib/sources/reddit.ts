import { DiscoveredAgent } from '../types';

const SUBREDDITS = ['AIAgents', 'LocalLLaMA', 'MachineLearning'];

async function getRedditToken(): Promise<string> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) throw new Error('REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set');

  const creds = Buffer.from(`${id}:${secret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'AgentsDash/1.0',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Reddit auth error: ${res.status}`);
  const data = await res.json() as any;
  return data.access_token;
}

export async function discoverFromReddit(): Promise<DiscoveredAgent[]> {
  const token = await getRedditToken();
  const results: DiscoveredAgent[] = [];

  for (const sub of SUBREDDITS) {
    const res = await fetch(`https://oauth.reddit.com/r/${sub}/new.json?limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'AgentsDash/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) continue;
    const data = await res.json() as any;

    for (const child of data.data?.children ?? []) {
      const post = child.data;
      results.push({
        name: post.title.slice(0, 80),
        url: `https://reddit.com${post.permalink}`,
        description: (post.selftext ?? post.title).slice(0, 600),
        source: 'reddit',
        rawData: post,
      });
    }
  }

  return results;
}
