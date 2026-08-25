# Referral Verification

- Referral records are stored in PostgreSQL (`referrals`).
- Each inviter receives a persistent referral code.
- Registration accepts `referralCode`, including `/register?ref=CODE`.
- Completing a referral atomically marks it `completed`.
- Both inviter and invitee receive 75 credits by default.
- Credit updates use PostgreSQL upsert + atomic `balance + amount`; no read-modify-write race.
- Concurrent claims are protected by `status = pending` in the atomic update; only the winner is rewarded.
- Self-referral and already-completed referrals are rejected.
- The UI loads data from `/api/referrals` and claims through `/api/referrals/claim`; it is not a static mock.
- No API/service keys are embedded.

Build note: a full dependency install/typecheck could not be executed in the current offline environment because pnpm was not cached and the registry was unreachable.
