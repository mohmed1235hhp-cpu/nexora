-- Migration 0002 — Hash session tokens at rest
--
-- The API used to store the raw bearer token in sessions.token and look it
-- up by plain equality. It now stores SHA-256(token) instead (see
-- artifacts/api-server/src/lib/session-cookie.ts:hashToken), so a database
-- leak or backup exposure no longer hands over directly reusable sessions.
--
-- Existing rows were written before this change and are plaintext, not
-- hashes, so they can never match a hashed lookup again. Purge them here
-- rather than leaving dead rows behind; affected users simply need to log
-- in again.
BEGIN;

TRUNCATE TABLE sessions;

COMMIT;
