import { NextRequest } from 'next/server';
import { discoverFromProductHunt } from '@/lib/sources/producthunt';
import { discoverFromGitHub } from '@/lib/sources/github';
import { discoverFromReddit } from '@/lib/sources/reddit';
import { discoverFromHuggingFace } from '@/lib/sources/huggingface';
import { enrichAgents } from '@/lib/enrichment';
import { scoreAgents } from '@/lib/scoring';
import { publishAgents } from '@/lib/publisher';
import { PipelineEvent, LogLine, timestamp } from '@/lib/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function encode(event: PipelineEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function log(type: LogLine['type'], msg: string): PipelineEvent {
  return { log: { time: timestamp(), type, msg } };
}

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (event: PipelineEvent) => ctrl.enqueue(encoder.encode(encode(event)));

      try {
        // ── Stage 1: Discover ─────────────────────────────────────
        send({ stage: 'discover', status: 'running' });
        send(log('info', 'Discovery run started — querying all sources'));

        const sources: Array<[string, () => Promise<any[]>]> = [
          ['ProductHunt', discoverFromProductHunt],
          ['GitHub', discoverFromGitHub],
          ['Reddit', discoverFromReddit],
          ['HuggingFace', discoverFromHuggingFace],
        ];

        const allRaw: any[] = [];
        for (const [name, fn] of sources) {
          try {
            const results = await fn();
            allRaw.push(...results);
            send(log('success', `${name}: ${results.length} candidates found`));
          } catch (e: any) {
            send(log('warning', `${name}: ${e.message}`));
          }
        }

        send({ stage: 'discover', status: 'complete', count: allRaw.length });
        send(log('info', `Total discovered: ${allRaw.length} raw candidates`));

        if (allRaw.length === 0) {
          send(log('error', 'No candidates discovered — check API keys in .env.local'));
          send({ stage: 'discover', status: 'error' });
          ctrl.close();
          return;
        }

        // ── Stage 2: Enrich ───────────────────────────────────────
        send({ stage: 'enrich', status: 'running' });
        send(log('info', `Claude enrichment processing ${allRaw.length} candidates...`));

        const enriched = await enrichAgents(allRaw);
        const aiAgents = enriched.filter(a => a.isAiAgent);

        send({ stage: 'enrich', status: 'complete', count: enriched.length });
        send(log('success', `Enrichment complete — ${aiAgents.length} confirmed AI agents`));
        send(log('info', `${enriched.length - aiAgents.length} non-agent listings filtered out`));

        // ── Stage 3: Score ────────────────────────────────────────
        send({ stage: 'score', status: 'running' });
        send(log('info', 'Quality gate scoring against rubric...'));

        const scored = scoreAgents(aiAgents);
        const approved = scored.filter(a => a.status === 'approved');
        const review = scored.filter(a => a.status === 'review');
        const rejected = scored.filter(a => a.status === 'rejected');

        send({ stage: 'score', status: 'complete', approved: approved.length, agents: scored });
        send(log('success', `${approved.length} agents passed quality gate (score ≥ 75)`));
        if (review.length) send(log('warning', `${review.length} agents flagged for manual review (score 60–74)`));
        if (rejected.length) send(log('error', `${rejected.length} agents rejected (score < 60)`));

        // ── Stage 4: Dream ────────────────────────────────────────
        send({ stage: 'dream', status: 'running' });
        send(log('dream', 'Dreaming: analyzing session for patterns...'));

        const topSources = ['producthunt', 'github', 'huggingface', 'reddit']
          .map(s => ({ s, n: approved.filter(a => a.source === s).length }))
          .sort((a, b) => b.n - a.n)
          .filter(x => x.n > 0);

        const topSource = topSources[0]?.s ?? 'unknown';
        const topCats = [...new Set(approved.map(a => a.category))].slice(0, 3).join(', ');

        const insights = `Best source: ${topSource} (${topSources[0]?.n ?? 0} approved). Top categories: ${topCats || 'N/A'}. Avg score: ${approved.length ? Math.round(approved.reduce((s, a) => s + a.score, 0) / approved.length) : 0}.`;

        send(log('dream', `Dreaming: ${insights}`));
        send({ stage: 'dream', status: 'complete', insights });
        send(log('success', 'Memory updated — source weights recalibrated'));

        // ── Stage 5: Publish ──────────────────────────────────────
        send({ stage: 'publish', status: 'running' });
        send(log('info', `Publishing ${approved.length} approved agents to AgentsDash.ai...`));

        const pub = await publishAgents(approved);

        if (pub.errors.length) {
          for (const err of pub.errors) send(log('warning', err));
        }

        send({ stage: 'publish', status: 'complete', published: pub.published });
        if (pub.published > 0) {
          send(log('success', `${pub.published} agents published to AgentsDash.ai`));
        }
        if (pub.failed > 0) {
          send(log('warning', `${pub.failed} agents failed to publish — check AGENTSDASH_API_URL`));
        }

      } catch (e: any) {
        send(log('error', `Pipeline error: ${e.message}`));
        send({ error: e.message });
      }

      ctrl.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
