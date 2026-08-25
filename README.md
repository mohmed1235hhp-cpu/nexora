# Cyber AI — Social & Community Platform

Production-grade monorepo for the Cyber AI platform: a social/community platform with
portfolios, stories, chat, followers, reputation, badges, notifications,
privacy controls, AI governance, and analytics.

## Architecture

```
├── artifacts/
│   ├── ai-cyberai/         # React + Vite frontend (wouter router)
│   └── api-server/     # Express 5 API server
├── lib/
│   ├── api-spec/       # OpenAPI 3.1 source of truth
│   ├── api-zod/        # Generated Zod schemas
│   ├── api-client-react/ # Orval-generated React Query client
│   └── db/             # Drizzle ORM schema + migrations
└── scripts/            # Ops / migration helpers
```

## Requirements

- Node.js ≥ 22
- pnpm ≥ 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- Docker (for the full local stack)

## In-app AI Builder + Live Preview

The workspace builder now includes a Lovable-style split view:
- OpenRouter/Qwen generates browser-preview-compatible projects using HTML5, CSS3 and JavaScript; React/frontend libraries are allowed only through CDN without JSX/build steps.
- The API stores a short-lived preview artifact and returns a preview URL.
- The workspace renders that URL in a sandboxed iframe inside the app.
- Users can request iterative changes from the builder chat and refresh the preview.
- Desktop/tablet/mobile preview modes are available.

The preview runtime is intentionally isolated from the parent app. The current preview store is in-memory and short-lived; production deployments should replace it with a persistent, isolated sandbox/runtime when executing arbitrary multi-file projects.

## Local development

```bash
# 1) install
pnpm install

# 2) launch Postgres + Redis
docker compose up -d postgres redis

# 3) run migrations
pnpm --filter @workspace/db run migrate

# 4) start API
pnpm --filter @workspace/api-server dev

# 5) start the web app (new terminal)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/cyber-ai dev
```

## Environment

Copy `.env.example` and fill values. All required variables are validated at
boot via Zod — the process refuses to start on invalid config. See
`artifacts/api-server/src/lib/env.ts` for the schema.

## Docker

```bash
docker compose up --build
```

Exposes the API on `:3000`, Postgres on `:5432`, Redis on `:6379`.

## Security

- Argon2id password hashing (bcrypt hashes transparently upgraded on next login)
- Helmet with strict CSP + HSTS
- CORS with explicit allowlist
- Global + per-route rate limiting
- Fail-fast environment validation
- Structured audit log for privileged actions
- Correlation IDs on every request

Report vulnerabilities via [`SECURITY.md`](./SECURITY.md).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). All PRs run through the CI pipeline
(lint → typecheck → test → build → docker) defined in
`.github/workflows/ci.yml`.

## License

MIT

---

## v6 additions (Enterprise Push)

See [`IMPROVEMENTS_V6.md`](./IMPROVEMENTS_V6.md) and [`CHANGELOG_V6.md`](./CHANGELOG_V6.md).

Highlights:
- AES-256-GCM at-rest encryption for AI provider keys
- httpOnly session cookies + CSRF + hashed session tokens
- Redis-backed rate limiting (rate-limiter-flexible) with in-memory fallback
- BullMQ background job queues
- OpenTelemetry + Sentry (backend + frontend)
- 17 new hot-path DB indexes + pg_trgm search
- RLS templates for every user-owned table
- i18n (ar/en, RTL) + SEO helper
- Playwright E2E + axe-core a11y
- OpenAPI additions for profile/portfolio/chat/notifications/reports
