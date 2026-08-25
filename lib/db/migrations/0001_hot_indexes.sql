-- Migration 0001 — Hot-path indexes (v6)
-- Applies all indexes flagged by PRODUCTION_AUDIT.md WARN-005
-- Safe to re-run: uses IF NOT EXISTS
BEGIN;

CREATE INDEX IF NOT EXISTS idx_portfolio_user_id       ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_created       ON portfolio_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower        ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followee        ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation   ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires         ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_user            ON stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash     ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user           ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_events_user        ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status          ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor        ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user   ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_user         ON reputation_events(user_id, created_at DESC);

-- Trigram for search (requires pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_users_username_trgm     ON users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_display_trgm      ON users USING gin (display_name gin_trgm_ops);

COMMIT;
