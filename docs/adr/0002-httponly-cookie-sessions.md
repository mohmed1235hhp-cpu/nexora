# ADR 0002 — httpOnly cookie session migration (planned)

**Status**: Proposed
**Date**: 2026-07

## Context

v4/v5 authenticate with opaque bearer tokens stored client-side in
`localStorage`. This is convenient for the Orval-generated React Query
client but exposes the token to XSS — any successful script injection
exfiltrates the session.

## Proposed decision

Move to short-lived access tokens (JWT, 15 min) + rotating refresh tokens
(30 days), both delivered as `Secure; HttpOnly; SameSite=Lax` cookies.
Add CSRF protection via a double-submit cookie (`X-CSRF-Token` header
mirrored by a non-httpOnly cookie).

## Migration path

1. Land helpers: `setAuthCookies(res, session)`, `clearAuthCookies(res)`,
   `readAccessToken(req)`.
2. Dual-accept: authorization from `Authorization: Bearer` OR from the
   access-token cookie during rollout.
3. Update frontend to `credentials: "include"` + drop `localStorage`.
4. Enforce cookie-only after two weeks of dual acceptance.

## Alternatives considered

- Web Cryptography-based signed cookies without a JWT payload: simpler but
  loses the ability to embed short-lived claims (role snapshot, feature
  flags).
- Server-side session stickiness with Redis lookups on every request: fine
  for small scale but adds a round trip per request.
