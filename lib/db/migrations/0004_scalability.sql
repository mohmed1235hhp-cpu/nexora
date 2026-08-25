-- =============================================================================
-- Migration 0004 — Scalability upgrade (target: 1,000,000 users)
-- =============================================================================
-- Purpose: additive hardening for hot paths, background processing, analytics,
--          AI cost tracking, activity feed, and soft-delete. Fully idempotent.
--          Does NOT drop or rename anything. Safe to re-run.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Required extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Soft-delete columns (deleted_at) on user-owned high-volume tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','portfolio_items','notifications','messages','conversations',
    'stories','follows','reports','ai_conversations','groups','group_members',
    'group_posts','group_comments'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', t);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_deleted_at ON %I(deleted_at) WHERE deleted_at IS NULL', t, t);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Hot-path composite / partial indexes (feed, timeline, unread)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_messages_conv_unread
  ON messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_public_recent
  ON portfolio_items(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stories_active
  ON stories(user_id, expires_at)
  WHERE expires_at > now();

-- ---------------------------------------------------------------------------
-- 3. Activity feed (fan-out on read)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_feed (
  id            BIGSERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL,
  actor_id      INTEGER,
  verb          TEXT    NOT NULL,           -- 'liked' | 'commented' | 'followed' | 'posted' | ...
  object_type   TEXT    NOT NULL,           -- 'portfolio' | 'story' | 'contest' | ...
  object_id     BIGINT  NOT NULL,
  target_type   TEXT,
  target_id     BIGINT,
  metadata      JSONB   NOT NULL DEFAULT '{}'::jsonb,
  visibility    TEXT    NOT NULL DEFAULT 'public',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_time
  ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor
  ON activity_feed(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_object
  ON activity_feed(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_metadata_gin
  ON activity_feed USING gin (metadata);

-- ---------------------------------------------------------------------------
-- 4. Credits ledger (append-only, double-entry ready)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credits_ledger (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL,
  delta           INTEGER NOT NULL,          -- signed; + earn, - spend
  balance_after   INTEGER NOT NULL,
  reason          TEXT    NOT NULL,          -- 'ai_image' | 'purchase' | 'refund' | 'contest_prize' | ...
  reference_type  TEXT,
  reference_id    TEXT,
  idempotency_key TEXT UNIQUE,
  metadata        JSONB   NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_time
  ON credits_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_reason
  ON credits_ledger(reason, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. AI usage / cost logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id                BIGSERIAL PRIMARY KEY,
  user_id           INTEGER,
  request_id        TEXT,
  provider          TEXT    NOT NULL,       -- 'openai' | 'gemini' | 'anthropic' | ...
  model             TEXT    NOT NULL,
  operation         TEXT    NOT NULL,       -- 'chat' | 'image' | 'voice' | 'ocr' | 'embed' | ...
  tokens_in         INTEGER NOT NULL DEFAULT 0,
  tokens_out        INTEGER NOT NULL DEFAULT 0,
  latency_ms        INTEGER NOT NULL DEFAULT 0,
  cost_usd_micro    BIGINT  NOT NULL DEFAULT 0,  -- USD * 1_000_000
  status            TEXT    NOT NULL,       -- 'ok' | 'error' | 'timeout' | 'ratelimited'
  error_code        TEXT,
  metadata          JSONB   NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time
  ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_model_time
  ON ai_usage_logs(provider, model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation_time
  ON ai_usage_logs(operation, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status_time
  ON ai_usage_logs(status, created_at DESC) WHERE status <> 'ok';

-- ---------------------------------------------------------------------------
-- 6. Generic analytics events (product + performance)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id           BIGSERIAL PRIMARY KEY,
  user_id      INTEGER,
  session_id   TEXT,
  event_name   TEXT   NOT NULL,
  properties   JSONB  NOT NULL DEFAULT '{}'::jsonb,
  source       TEXT,                        -- 'web' | 'mobile' | 'server'
  ip_hash      TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time
  ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_props_gin
  ON analytics_events USING gin (properties);

-- ---------------------------------------------------------------------------
-- 7. Slow query & performance log (surface in Analytics dashboard)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perf_slow_queries (
  id           BIGSERIAL PRIMARY KEY,
  route        TEXT    NOT NULL,
  method       TEXT    NOT NULL,
  duration_ms  INTEGER NOT NULL,
  status_code  INTEGER,
  user_id      INTEGER,
  metadata     JSONB   NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perf_slow_route_time
  ON perf_slow_queries(route, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_slow_duration
  ON perf_slow_queries(duration_ms DESC, created_at DESC);

-- ---------------------------------------------------------------------------
-- 8. Full-text search on users / portfolio (GIN + trigram already loaded)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'portfolio_items' AND column_name = 'title') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_portfolio_title_trgm
               ON portfolio_items USING gin (title gin_trgm_ops)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'portfolio_items' AND column_name = 'description') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_portfolio_desc_trgm
               ON portfolio_items USING gin (description gin_trgm_ops)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9. Rate-limit counters (Redis-preferred; DB fallback for durability)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key    TEXT PRIMARY KEY,
  count         INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires
  ON rate_limit_buckets(expires_at);

-- ---------------------------------------------------------------------------
-- 10. Idempotency store (for write endpoints, webhooks, jobs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key          TEXT PRIMARY KEY,
  scope        TEXT NOT NULL,
  response     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON idempotency_keys(expires_at);

-- ---------------------------------------------------------------------------
-- 11. Session hardening (token already hashed in migration 0002 — add index)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='sessions' AND column_name='expires_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_sessions_active
               ON sessions(user_id, expires_at)
               WHERE expires_at > now()';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 12. Contests hot-path indexes
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contest_participations') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contest_part_contest_score
               ON contest_participations(contest_id, score DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contest_part_user
               ON contest_participations(user_id, created_at DESC)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contests') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contests_active_window
               ON contests(status, start_at, end_at)
               WHERE status IN (''pending'',''active'')';
  END IF;
END $$;

COMMIT;
