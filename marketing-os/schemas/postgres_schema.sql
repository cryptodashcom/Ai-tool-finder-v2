-- Marketing OS v3 — PostgreSQL Schema
-- Phase 1: publish_log, retry_queue, token_usage, engagement_log

CREATE TABLE IF NOT EXISTS campaigns (
    id              SERIAL PRIMARY KEY,
    campaign_id     TEXT UNIQUE NOT NULL,
    brand           TEXT NOT NULL,
    objective       TEXT,
    target_audience TEXT,
    key_message     TEXT,
    tone            TEXT,
    platforms       TEXT[],
    quality_threshold_override INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_campaign_id ON campaigns(campaign_id);

CREATE TABLE IF NOT EXISTS publish_log (
    id              SERIAL PRIMARY KEY,
    campaign_id     TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
    platform        TEXT NOT NULL,
    post_id         TEXT,
    post_url        TEXT,
    content_preview TEXT,
    variant         TEXT DEFAULT 'A',
    status          TEXT NOT NULL DEFAULT 'pending',
    quality_score   INTEGER,
    engagement_rate NUMERIC(8,4) DEFAULT 0,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publish_log_campaign_id   ON publish_log(campaign_id);
CREATE INDEX idx_publish_log_platform      ON publish_log(platform);
CREATE INDEX idx_publish_log_published_at  ON publish_log(published_at);
CREATE INDEX idx_publish_log_status        ON publish_log(status);

CREATE TABLE IF NOT EXISTS retry_queue (
    id              SERIAL PRIMARY KEY,
    workflow_id     TEXT NOT NULL,
    execution_id    TEXT,
    node_name       TEXT NOT NULL,
    campaign_id     TEXT,
    platform        TEXT,
    error_message   TEXT,
    payload         JSONB,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 5,
    next_retry_at   TIMESTAMPTZ,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retry_queue_next_retry_at ON retry_queue(next_retry_at) WHERE NOT resolved;
CREATE INDEX idx_retry_queue_campaign_id   ON retry_queue(campaign_id);

CREATE TABLE IF NOT EXISTS token_usage (
    id              SERIAL PRIMARY KEY,
    campaign_id     TEXT,
    workflow_id     TEXT,
    node_name       TEXT NOT NULL,
    model           TEXT NOT NULL,
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    cost_usd        NUMERIC(10,6) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_usage_campaign_id ON token_usage(campaign_id);
CREATE INDEX idx_token_usage_created_at  ON token_usage(created_at);

CREATE TABLE IF NOT EXISTS engagement_log (
    id              SERIAL PRIMARY KEY,
    publish_log_id  INTEGER REFERENCES publish_log(id) ON DELETE SET NULL,
    campaign_id     TEXT,
    platform        TEXT NOT NULL,
    post_id         TEXT NOT NULL,
    comment_id      TEXT,
    author          TEXT,
    content         TEXT,
    sentiment       TEXT,
    reply_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    reply_content   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_engagement_log_post_id     ON engagement_log(post_id);
CREATE INDEX idx_engagement_log_campaign_id ON engagement_log(campaign_id);
CREATE INDEX idx_engagement_log_created_at  ON engagement_log(created_at);

CREATE TABLE IF NOT EXISTS recycle_queue (
    id              SERIAL PRIMARY KEY,
    publish_log_id  INTEGER REFERENCES publish_log(id) ON DELETE CASCADE,
    campaign_id     TEXT,
    platform        TEXT NOT NULL,
    original_post_id TEXT,
    scheduled_at    TIMESTAMPTZ,
    recycled        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_store (
    id              SERIAL PRIMARY KEY,
    platform        TEXT UNIQUE NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    expires_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
