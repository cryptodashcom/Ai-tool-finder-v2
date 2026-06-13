import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  brief: text('brief', { mode: 'json' }).notNull(),
  strategy: text('strategy', { mode: 'json' }),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const campaignPosts = sqliteTable('campaign_posts', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  platform: text('platform').notNull(),
  copy: text('copy', { mode: 'json' }),
  mediaAssets: text('media_assets', { mode: 'json' }),
  qualityScore: text('quality_score', { mode: 'json' }),
  publishResult: text('publish_result', { mode: 'json' }),
  status: text('status').notNull().default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id'),
  stage: text('stage').notNull(),
  event: text('event').notNull(),
  payload: text('payload', { mode: 'json' }),
  level: text('level').notNull().default('info'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignPost = typeof campaignPosts.$inferSelect;
export type NewCampaignPost = typeof campaignPosts.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
