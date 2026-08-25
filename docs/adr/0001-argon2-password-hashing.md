# ADR 0001 — Argon2id for password hashing

**Status**: Accepted (v5)
**Date**: 2026-07

## Context

v4 shipped bcrypt at cost 12 for password hashing. bcrypt remains acceptable
but Argon2id is the OWASP 2024 recommended algorithm — it is memory-hard,
which raises the cost of GPU/ASIC attacks meaningfully beyond bcrypt.

## Decision

Adopt Argon2id via `argon2` (Node native binding). Parameters:

- memoryCost: 65 536 KiB (64 MiB)
- timeCost: 3 iterations
- parallelism: 4 lanes

All tunable via env vars (`ARGON2_*`) so we can raise the cost floor over
time without re-hashing everyone up-front.

## Migration

Legacy bcrypt hashes (`$2a/$2b/$2y$`) are still verifiable. On every
successful login with a bcrypt hash, the plaintext password is re-hashed
with Argon2 and persisted transparently. No forced-reset flow needed.

## Consequences

- Argon2 requires ~64 MiB per verification. At current login volume this is
  negligible; if we scale past ~50 logins/sec on a single node we will need
  a rate-limit tier or a dedicated auth worker.
- The `argon2` package ships a native binding — Alpine builds need
  `libstdc++` (already present in `node:22-alpine`).
