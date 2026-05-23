import { DiscoveredAgent } from '../types';

const PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';

const QUERY = `
  {
    posts(order: NEWEST, first: 20, topic: "artificial-intelligence") {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          topics { edges { node { name } } }
        }
      }
    }
  }
`;

export async function discoverFromProductHunt(): Promise<DiscoveredAgent[]> {
  const key = process.env.PRODUCTHUNT_API_KEY;
  if (!key) throw new Error('PRODUCTHUNT_API_KEY not set');

  const res = await fetch(PH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) throw new Error(`ProductHunt API error: ${res.status}`);
  const data = await res.json() as any;

  return (data.data?.posts?.edges ?? []).map(({ node }: any): DiscoveredAgent => ({
    name: node.name,
    url: node.url,
    description: [node.tagline, node.description].filter(Boolean).join(' — '),
    source: 'producthunt',
    rawData: node,
  }));
}
