import { EnrichedAgent, ScoredAgent } from './types';
import crypto from 'crypto';

function scoreDescription(desc: string): number {
  if (!desc || desc.length < 20) return 0;
  if (desc.length < 50) return 10;
  if (desc.length < 100) return 20;
  return 30;
}

function scoreCategoryFit(agent: EnrichedAgent): number {
  if (!agent.isAiAgent) return 0;
  if (agent.category === 'Other') return 15;
  return 25;
}

function scoreUniqueness(agent: EnrichedAgent, seen: Set<string>): number {
  const key = agent.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (seen.has(key)) return 0;
  seen.add(key);
  return 25;
}

function scoreTags(tags: string[]): number {
  if (tags.length === 0) return 0;
  if (tags.length >= 3) return 20;
  return 10;
}

export function scoreAgents(agents: EnrichedAgent[]): ScoredAgent[] {
  const seen = new Set<string>();

  return agents.map((agent): ScoredAgent => {
    const descScore = scoreDescription(agent.enrichedDescription);
    const categoryScore = scoreCategoryFit(agent);
    const uniquenessScore = scoreUniqueness(agent, seen);
    const tagScore = scoreTags(agent.tags);

    const score = descScore + categoryScore + uniquenessScore + tagScore;
    const status = score >= 75 ? 'approved' : score >= 60 ? 'review' : 'rejected';

    return {
      ...agent,
      id: crypto.randomUUID(),
      score,
      status,
    };
  });
}
