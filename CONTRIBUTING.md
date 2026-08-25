# Contributing

## Getting started

1. Fork and clone
2. `corepack enable && corepack prepare pnpm@9 --activate`
3. `pnpm install`
4. `docker compose up -d postgres redis`
5. `pnpm --filter @workspace/db run migrate`

## Development loop

- **Type safety**: `pnpm run typecheck` must pass before pushing.
- **Tests**: add tests for every bug fix and feature.
  `pnpm -r --if-present run test`.
- **Schemas**: edit `lib/api-spec/openapi.yaml` → regenerate zod & client:
  `pnpm --filter @workspace/api-zod run generate` and
  `pnpm --filter @workspace/api-client-react run generate`.
- **Migrations**: edit `lib/db/src/schema/*` → generate migration:
  `pnpm --filter @workspace/db run generate`.

## Coding conventions

- TypeScript strict mode everywhere.
- Prefer named exports.
- Every Express route MUST use the generic `validate()` middleware from
  `artifacts/api-server/src/middlewares/validate.ts` for body / query / params.
- Never call `res.status(500).send(err.stack)` or leak internals; return
  `{ error: "…" }` and log the full error server-side.
- Every privileged action MUST emit an audit event via `audit()`.

## PR checklist

- [ ] `pnpm run typecheck` passes
- [ ] Tests added or updated
- [ ] OpenAPI updated when API changes
- [ ] Migration + rollback path for DB changes
- [ ] Audit event for privileged operations
- [ ] Docs updated (README / SECURITY / this file) when behavior changes
