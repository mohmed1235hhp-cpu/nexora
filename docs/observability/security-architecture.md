# Security Architecture

`SecurityManager` composes the sub-systems:

- `ApiProtection` — body-size limits, rate limiting, replay/nonce cache,
  HMAC signature verification (via `RequestValidator`), threat inspection.
- `ThreatDetector` — rule engine + per-source rate-anomaly detector, emits
  `ThreatEvent`s on an internal `EventBus`.
- `PermissionValidator` — RBAC (`role → permissions`) plus per-resource
  ACLs and owner short-circuits.
- `InputValidator` — thin wrapper around any zod-compatible schema; also
  provides a control-char stripping sanitizer.
- `RateLimiter` — token bucket + sliding window per key.
- `SecretsManager` — ordered provider chain (`InMemorySecretsProvider`,
  `EnvSecretsProvider`) with in-memory cache and `require()` helper.
- `EnvironmentValidator` — start-up validation of required env keys and
  patterns.

Every subsystem is interface-first; no HTTP framework is imported.
