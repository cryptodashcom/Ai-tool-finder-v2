#!/usr/bin/env node
import { readFileSync } from 'fs';
import { runCampaignJob } from '@marketing-os/jobs';
import type { CampaignBrief } from '@marketing-os/core';

const briefPath = process.argv[2];
if (!briefPath) {
  console.error('Usage: tsx run-campaign.ts <path-to-brief.json>');
  process.exit(1);
}

const brief: CampaignBrief = JSON.parse(readFileSync(briefPath, 'utf-8'));
console.log(`Running campaign: ${brief.brand} — ${brief.product}`);

const ctx = await runCampaignJob(brief);
console.log(JSON.stringify(ctx, null, 2));
