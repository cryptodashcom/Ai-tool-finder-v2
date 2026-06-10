#!/usr/bin/env node
import { runCampaignJob } from '@marketing-os/jobs';
import type { CampaignBrief } from '@marketing-os/core';

const exampleBrief: CampaignBrief = {
  brand: 'TechNova',
  product: 'AI Workflow Automation Platform',
  objective: 'awareness',
  targetAudience: 'B2B software teams and CTOs at mid-size tech companies',
  keyMessages: [
    'Cut deployment time by 60% with AI-powered workflows',
    'No-code automation that scales with your team',
    '14-day free trial, no credit card required',
  ],
  tone: 'confident, innovative, approachable',
  platforms: ['twitter', 'linkedin', 'email', 'blog'],
};

console.log('Marketing OS — Phase 1 Pipeline');
console.log('=================================');
console.log(`Running campaign for: ${exampleBrief.brand} — ${exampleBrief.product}`);
console.log(`Platforms: ${exampleBrief.platforms.join(', ')}\n`);

const ctx = await runCampaignJob(exampleBrief);

console.log('\n=== PIPELINE RESULT ===');
console.log(`Campaign ID: ${ctx.campaignId}`);
console.log(`Status: ${ctx.status}`);
console.log(`Duration: ${((ctx.completedAt?.getTime() ?? Date.now()) - ctx.startedAt.getTime()) / 1000}s`);

if (ctx.strategy) {
  console.log(`\nPositioning: ${ctx.strategy.positioning}`);
  console.log(`Primary Message: ${ctx.strategy.messagingFramework.primaryMessage}`);
  console.log(`CTA: ${ctx.strategy.messagingFramework.callToAction}`);
}

if (ctx.copies) {
  console.log('\n--- COPY ---');
  for (const c of ctx.copies) {
    const score = ctx.qualityScores?.[c.platform];
    console.log(`[${c.platform.toUpperCase()}] Score: ${score?.overall ?? 'N/A'} | Approved: ${score?.approved ?? 'N/A'}`);
    console.log(`  ${c.body.substring(0, 120)}${c.body.length > 120 ? '...' : ''}`);
  }
}

if (ctx.publishResults) {
  console.log('\n--- PUBLISH RESULTS ---');
  for (const r of ctx.publishResults) {
    console.log(`[${r.platform}] ${r.success ? 'OK' : 'FAIL'} ${r.url ?? r.error ?? ''}`);
  }
}

if (ctx.errors.length > 0) {
  console.log('\n--- ERRORS ---');
  for (const e of ctx.errors) {
    console.log(`  [${e.stage}] ${e.error}`);
  }
}
