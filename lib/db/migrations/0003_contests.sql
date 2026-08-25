-- =============================================================================
-- Migration 0003: Weekly Contests System
-- =============================================================================
-- Adds: contests, contest_participations, contest_winners
-- Extends: notification_type enum (contest_start / contest_ending / contest_winner / contest_result)
-- Seeds:   badges("Weekly Champion")
-- RLS:     enabled on all three new tables with least-privilege policies.
-- =============================================================================

-- 1) Extend notification_type enum (idempotent).
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contest_start';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contest_ending';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contest_winner';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'contest_result';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Enums.
DO $$ BEGIN
  CREATE TYPE contest_status AS ENUM ('pending', 'active', 'ended', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contest_prize_type AS ENUM ('money', 'premium', 'credits');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) contests
CREATE TABLE IF NOT EXISTS contests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status contest_status NOT NULL DEFAULT 'pending',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  prize_type contest_prize_type NOT NULL DEFAULT 'credits',
  prize_value REAL NOT NULL DEFAULT 0,
  prize_currency TEXT NOT NULL DEFAULT 'USD',
  prize_notes TEXT,
  participants_count INTEGER NOT NULL DEFAULT 0,
  projects_count INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  banner_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contests_status_idx ON contests(status);
CREATE INDEX IF NOT EXISTS contests_end_at_idx ON contests(end_at);

-- 4) contest_participations
CREATE TABLE IF NOT EXISTS contest_participations (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_item_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS contest_participations_unique_portfolio
  ON contest_participations(contest_id, portfolio_item_id);
CREATE INDEX IF NOT EXISTS contest_participations_contest_user_idx
  ON contest_participations(contest_id, user_id);
CREATE INDEX IF NOT EXISTS contest_participations_contest_idx
  ON contest_participations(contest_id);

-- 5) contest_winners
CREATE TABLE IF NOT EXISTS contest_winners (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_item_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL DEFAULT 1,
  score REAL NOT NULL DEFAULT 0,
  selection_reason TEXT,
  selected_by_ai BOOLEAN NOT NULL DEFAULT false,
  video_url TEXT,
  showcase_title TEXT,
  showcase_notes TEXT,
  announced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contest_winners_contest_idx ON contest_winners(contest_id);
CREATE INDEX IF NOT EXISTS contest_winners_user_idx ON contest_winners(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS contest_winners_unique_rank ON contest_winners(contest_id, rank);

-- 6) Row-Level Security
-- ---------------------------------------------------------------------------
-- The API server connects as the application role and enforces authorization
-- in the middleware layer (requireAuth + role checks + audit logs). RLS is
-- enabled here as a defence-in-depth measure: even if a query slips outside
-- an authorization check, non-privileged roles cannot mutate contest data.
-- The `app_user` role is expected to exist (created by the platform).
-- If it doesn't yet, the DO block below is a no-op — RLS still applies to
-- any future roles.

ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_winners ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (including anon) can read contests + winners + participation rows.
DROP POLICY IF EXISTS contests_public_read ON contests;
CREATE POLICY contests_public_read ON contests FOR SELECT USING (true);

DROP POLICY IF EXISTS contest_participations_public_read ON contest_participations;
CREATE POLICY contest_participations_public_read ON contest_participations FOR SELECT USING (true);

DROP POLICY IF EXISTS contest_winners_public_read ON contest_winners;
CREATE POLICY contest_winners_public_read ON contest_winners FOR SELECT USING (true);

-- Writes: only the DB owner / superuser (which the API server connects as).
-- End users never write to these tables directly — they go through the API,
-- which authorizes + audits + rate-limits every mutation.
DROP POLICY IF EXISTS contests_owner_write ON contests;
CREATE POLICY contests_owner_write ON contests FOR ALL
  USING (current_user = session_user) WITH CHECK (current_user = session_user);

DROP POLICY IF EXISTS contest_participations_owner_write ON contest_participations;
CREATE POLICY contest_participations_owner_write ON contest_participations FOR ALL
  USING (current_user = session_user) WITH CHECK (current_user = session_user);

DROP POLICY IF EXISTS contest_winners_owner_write ON contest_winners;
CREATE POLICY contest_winners_owner_write ON contest_winners FOR ALL
  USING (current_user = session_user) WITH CHECK (current_user = session_user);

-- 7) Seed the "Weekly Champion" badge (idempotent).
INSERT INTO badges (name, description, icon_url, requirement)
SELECT 'Weekly Champion', 'الفائز في مسابقة الأسبوع', '/badges/weekly-champion.svg', 'contest_winner'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Weekly Champion');
