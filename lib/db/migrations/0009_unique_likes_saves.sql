-- Migration 0009 — Unique constraints on portfolio_likes / portfolio_saves
-- =============================================================================
-- The app previously did a SELECT-then-INSERT to toggle a like/save, which
-- is not atomic: two near-simultaneous requests (double-tap, client retry
-- after a slow response) can both pass the SELECT before either INSERT
-- lands, producing two rows for the same (user_id, portfolio_item_id) pair.
-- That silently double-counts likesCount and makes "unlike" only remove one
-- of the two rows, leaving the item stuck in a liked state.
--
-- This adds the missing uniqueness at the database level and backs it with
-- an index so the app can use onConflictDoNothing for a truly atomic toggle.
-- Existing duplicate rows (if any) are collapsed first, keeping the oldest,
-- so the migration can run safely against production data.
-- =============================================================================

BEGIN;

-- Collapse any pre-existing duplicates before the constraint is added.
DELETE FROM portfolio_likes a
USING portfolio_likes b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.portfolio_item_id = b.portfolio_item_id;

DELETE FROM portfolio_saves a
USING portfolio_saves b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.portfolio_item_id = b.portfolio_item_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_portfolio_likes_user_item
  ON portfolio_likes(user_id, portfolio_item_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_portfolio_saves_user_item
  ON portfolio_saves(user_id, portfolio_item_id);

COMMIT;
