-- =============================================================================
-- Media pipeline scalability upgrade (target: 1M users)
-- =============================================================================
-- Adds: retry_count, priority, last_error, processing_time_ms, attempt_count,
--       status_history (JSONB), timing indexes, priority-aware queue index,
--       chunk-upload tracking table, media processing metrics view.
-- Fully idempotent.
-- =============================================================================

BEGIN;

-- 1. Extend media_jobs
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS retry_count       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS max_retries       INTEGER NOT NULL DEFAULT 3;
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS priority          INTEGER NOT NULL DEFAULT 5;   -- 0 = highest, 10 = lowest
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS last_error        TEXT;
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS status_history    JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS scheduled_at      TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE media_jobs ADD COLUMN IF NOT EXISTS is_premium        BOOLEAN NOT NULL DEFAULT false;

-- 2. Queue-ordering index: priority first, then FIFO
CREATE INDEX IF NOT EXISTS media_jobs_queue_order
  ON media_jobs (status, priority ASC, scheduled_at ASC)
  WHERE status IN ('queued','running');

-- 3. Analytical index: throughput per user
CREATE INDEX IF NOT EXISTS media_jobs_user_kind_time
  ON media_jobs (user_id, kind, created_at DESC);

-- 4. Chunk upload tracking (resumable multi-part uploads)
CREATE TABLE IF NOT EXISTS media_upload_chunks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id      TEXT   NOT NULL,
  user_id        UUID   NOT NULL,
  chunk_index    INTEGER NOT NULL,
  chunk_size     INTEGER NOT NULL,
  checksum       TEXT   NOT NULL,
  storage_key    TEXT   NOT NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (upload_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS media_upload_chunks_upload
  ON media_upload_chunks (upload_id, chunk_index);
CREATE INDEX IF NOT EXISTS media_upload_chunks_user
  ON media_upload_chunks (user_id, received_at DESC);

-- 5. Media assets: soft-delete + CDN URL
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS cdn_url    TEXT;
CREATE INDEX IF NOT EXISTS media_assets_active
  ON media_assets(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- 6. Aggregated media metrics view (feeds Analytics dashboard)
CREATE OR REPLACE VIEW media_metrics_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  kind,
  provider,
  count(*)                      AS operations,
  avg(latency_ms)::INTEGER      AS avg_latency_ms,
  sum(cost_usd_micro)           AS total_cost_micro
FROM media_history
GROUP BY 1, 2, 3;

COMMIT;
