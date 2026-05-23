export interface DiscoveredAgent {
  name: string;
  url: string;
  description: string;
  source: 'producthunt' | 'github' | 'huggingface' | 'reddit';
  rawData: Record<string, unknown>;
}

export interface EnrichedAgent extends DiscoveredAgent {
  category: string;
  tags: string[];
  pricing: 'free' | 'freemium' | 'paid' | 'unknown';
  enrichedDescription: string;
  isAiAgent: boolean;
}

export interface ScoredAgent extends EnrichedAgent {
  id: string;
  score: number;
  status: 'approved' | 'review' | 'rejected';
}

export interface PipelineEvent {
  stage?: string;
  status?: 'running' | 'complete' | 'error';
  count?: number;
  approved?: number;
  published?: number;
  agents?: ScoredAgent[];
  insights?: string;
  log?: LogLine;
  error?: string;
}

export interface LogLine {
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'dream';
  msg: string;
}

export function timestamp(): string {
  return new Date().toTimeString().slice(0, 8);
}
