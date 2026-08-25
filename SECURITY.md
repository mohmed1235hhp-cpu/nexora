# Security Policy

## Reporting a Vulnerability

Please report vulnerabilities privately to **security@cyberai.example** (replace
with the project's real contact). Do NOT open a public GitHub issue for
security matters.

Include:

- A clear description of the issue and its impact
- Steps to reproduce (proof-of-concept if possible)
- Affected commit / version
- Your disclosure timeline expectations

We acknowledge reports within **72 hours** and aim to ship a fix or mitigation
within **14 days** for high-severity issues.

## Supported Versions

Only the latest `main` branch is actively supported. Users of older branches
should update.

## Security Controls in Place

- **Passwords**: Argon2id (OWASP 2024 recommended parameters); legacy bcrypt
  hashes are transparently migrated on next successful login.
- **Sessions**: opaque random tokens stored server-side with expiry.
  Migration to short-lived access + rotating refresh tokens via httpOnly
  Secure SameSite cookies is on the roadmap.
- **Transport**: HSTS enforced in production.
- **Headers**: Helmet with strict CSP, frame-ancestors 'none', object-src
  'none', X-Content-Type-Options nosniff, Referrer-Policy strict-origin.
- **CORS**: explicit allowlist via `ALLOWED_ORIGINS`; hard-deny in production
  when unset.
- **Rate limiting**: global + auth-specific limiters; per-user limits on the
  roadmap (requires Redis).
- **Input validation**: Zod schemas via generic `validate()` middleware.
- **RBAC**: 5-role model (`user`, `moderator`, `admin`, `super_admin`, plus
  soft-suspended states); role-gated middleware.
- **Audit log**: structured events for auth, role changes, bans, deletions,
  reports.
- **Env validation**: fail-fast at boot; no silent misconfiguration.
- **Error handling**: stack traces never returned to clients; requests carry
  correlation IDs for log correlation.
- **Supply chain**: pnpm `minimumReleaseAge: 1440` (1-day publish delay) to
  mitigate npm supply-chain attacks.

## Known Gaps (tracked in IMPROVEMENTS.md)

- Tokens are still Bearer-in-header; migrate to httpOnly cookies + CSRF.
- Rate limiting is per-IP; add per-user limits.
- No end-to-end encryption for chat.
- No formal SOC2/ISO controls; audit log retention is application-level only.
