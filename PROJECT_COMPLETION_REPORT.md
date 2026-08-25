# NEXORA V2 — Completion Pass

This archive contains the completion pass requested before launch, with external
provider credentials intentionally left for the owner.

## Implemented in this pass
- Email verification token flow with hashed, expiring tokens.
- Forgot-password and password-reset flow with one-time, expiring tokens.
- Referral codes and referral reward credits.
- Developer Portal with personal API-key creation, listing and revocation.
- Bearer API-key authentication using SHA-256 hashes; plaintext keys are shown once.
- Data export job with queued/processing/ready/failed states and user-scoped download.
- Frontend routes for email verification, password reset, forgot password,
  Developer Portal and referrals.
- Production environment placeholders for transactional email and export storage.
- Database migration `0008_account_features.sql`.
- New account feature schema tables.

## Intentionally not populated
No real third-party API/provider credentials were added to the repository.
Those remain external secrets as requested.

## Verification note
The uploaded archive was unpacked and the changed TypeScript files were parsed
with the available TypeScript compiler in dependency-free syntax mode. A full
workspace build/typecheck requires installing the repository's pnpm dependencies
and connecting a real PostgreSQL/Redis environment.
