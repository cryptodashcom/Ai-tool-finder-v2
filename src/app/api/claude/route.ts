import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });
  }

  const { prompt } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are the AI brain of AgentsDash.ai — an AI agent directory. Help the founder manage listings, analyze quality, and improve the discovery pipeline. Be concise, sharp, and specific. Use bullet points when listing things.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Claude API error: ${res.status} — ${err}` }, { status: 502 });
  }

  const data = await res.json() as any;
  const text: string = data.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('') ?? '';

  return NextResponse.json({ text });
}
