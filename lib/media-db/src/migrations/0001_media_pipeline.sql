-- Phase 2 media pipeline migration
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  mime_type text NOT NULL,
  storage_key text NOT NULL,
  public_url text,
  size_bytes integer,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_user_idx ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS media_assets_kind_idx ON media_assets(kind);

CREATE TABLE IF NOT EXISTS media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  input jsonb NOT NULL,
  output jsonb,
  error text,
  progress integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS media_jobs_user_idx ON media_jobs(user_id);
CREATE INDEX IF NOT EXISTS media_jobs_status_idx ON media_jobs(status);

CREATE TABLE IF NOT EXISTS media_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid,
  asset_id uuid,
  kind text NOT NULL,
  adapter_id text NOT NULL,
  provider text NOT NULL,
  latency_ms integer NOT NULL,
  cost_usd_micro integer NOT NULL DEFAULT 0,
  telemetry jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_history_user_idx ON media_history(user_id);
CREATE INDEX IF NOT EXISTS media_history_created_idx ON media_history(created_at);
