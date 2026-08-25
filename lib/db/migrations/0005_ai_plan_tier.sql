-- =============================================================================
-- Migration 0005: Subscription plan tier for AI usage limits (Phase 2 —
-- Multi-AI Provider Architecture: video-generation daily caps by plan)
-- =============================================================================
-- Adds: user_credits.plan ('free' | 'premium' | 'pro'), default 'free'
-- Used by: artifacts/api-server/src/lib/videoLimits.ts to enforce
--   Free: 1 video / 24h, Premium: 2 / 24h, Pro: 5 / 24h
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('free', 'premium', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS plan user_plan NOT NULL DEFAULT 'free';
