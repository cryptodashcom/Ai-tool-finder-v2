---
name: marketing-os
description: Conventions for the Marketing OS v3 project. Use when building
  n8n nodes, sub-workflows, or supporting code for the autonomous marketing pipeline.
---

# Marketing OS Conventions

## Core Rules

- All AI prompts MUST be fetched from Notion Prompt DB at runtime — never hardcode prompts
- Every AI call MUST be followed by Token Cost Tracker (logs to token_usage table)
- All publishing nodes MUST use exponential backoff: 1 s → 2 s → 4 s → 8 s → 16 s (max 5 retries)
- Campaign tagging: every node output MUST include `campaign_id`
- Media URLs always reference CDN URLs from `format_map`, never raw Minimax URLs
- Quality Score threshold can be overridden per campaign in the CAMPAIGNS_DB Notion database

## Node Naming Conventions

- Trigger nodes: `[Platform] Webhook` or `[Trigger Type] Trigger`
- AI agents: `[Function] Agent` (e.g. `Strategy Agent`, `Content Agent`)
- Platform publishers: `Publish to [Platform]`
- Database operations: `Log [Action]` or `Fetch [Resource]`
- Set / transform nodes: `Prepare [Resource]` or `Format [Resource]`

## Data Structures

### Campaign Brief (webhook input)
```json
{
  "campaign_id": "string (unique, alphanumeric, no commas)",
  "brand": "string",
  "objective": "string",
  "target_audience": "string",
  "key_message": "string",
  "tone": "string",
  "platforms": ["twitter", "instagram", "linkedin"]
}
```

### Strategy Output (from Strategy Generation Agent)
```json
{
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "key_messages": ["Message 1", "Message 2", "Message 3"],
  "tone_direction": "string",
  "cta": "string"
}
```

### Format Map (Phase 2+, after media generation)
```json
{
  "format_map": {
    "video_916": "https://cdn.example.com/v_916.mp4",
    "video_11":  "https://cdn.example.com/v_11.mp4",
    "video_169": "https://cdn.example.com/v_169.mp4",
    "image_11":  "https://cdn.example.com/i_11.jpg",
    "image_169": "https://cdn.example.com/i_169.jpg",
    "image_23":  "https://cdn.example.com/i_23.jpg",
    "image_916": "https://cdn.example.com/i_916.jpg"
  }
}
```

## Platform Character Limits

| Platform  | Text limit | Hashtags |
|-----------|-----------|----------|
| X/Twitter | 280       | 1-2      |
| LinkedIn  | 3000      | 3-5      |
| Instagram | 2200      | up to 30 |
| TikTok    | 2200      | 5-20     |
| Threads   | 500       | 1-2      |
| Bluesky   | 300       | 2-4      |
| Mastodon  | 500       | 2-5      |
| Facebook  | 63206     | 2-5      |

## Build Phase Reference

| Phase | Goal |
|-------|------|
| 1     | Single post to X/Twitter end-to-end |
| 2     | Video + image pipeline (Minimax + FFmpeg/Cloudinary) |
| 3     | Quality gate + error handler + cost tracking |
| 4     | All 11 platform channel agents |
| 5     | Brand voice + trends + competitor intelligence |
| 6     | Analytics + feedback loop + evergreen recycler |
| 7     | v3 enhancements (smart scheduling, engagement monitor, etc.) |
| 8     | Load testing + production hardening |
