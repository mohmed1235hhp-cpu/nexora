# Errors Module (`@workspace/core/errors`)

Unified error handling for every backend service in Cyber AI.

## Why this exists

Before this module, every route in `api-server` caught its own errors and
built its own `res.status(...).json({ error: "..." })` response by hand.
That means:
- inconsistent shapes (some routes return `{ error }`, some `{ message }`)
- no stable `code` the frontend can branch on (only human-readable strings)
- easy to accidentally leak an internal error message or stack trace
- ~20+ near-identical `try/catch` blocks to maintain

This module fixes that with one error hierarchy, one middleware, and one
wrapper for async route handlers.

## Usage

```ts
import { asyncHandler, NotFoundError, ConflictError, ErrorCode } from "@workspace/core/errors";

router.post("/users", asyncHandler(async (req, res) => {
  const existing = await findByUsername(req.body.username);
  if (existing) {
    throw new ConflictError("Username already taken", { code: ErrorCode.USERNAME_TAKEN });
  }
  // ...
  res.status(201).json({ user });
}));
```

Register the middleware **once**, last, in `app.ts`:

```ts
import { createErrorMiddleware } from "@workspace/core/errors";
import { logger } from "./lib/logger";

// ... all routes registered above this line ...
app.use(createErrorMiddleware({ logger }));
```

## Rules

- Throw a specific `AppError` subclass (`ValidationError`, `NotFoundError`,
  `ForbiddenError`, `ConflictError`, `UnauthorizedError`, `RateLimitError`)
  for any *expected* failure condition. The message you pass is shown to
  the client, so keep it user-safe.
- Never throw a plain `Error` for expected conditions — reserve that for
  genuine bugs. Unrecognized errors are always converted to a generic
  500 with no leaked detail.
- Always wrap async route handlers in `asyncHandler(...)` instead of
  hand-written `try/catch`.
- Add new domain codes to `ErrorCode` rather than inventing ad-hoc strings.
