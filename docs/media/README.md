# Cyber AI Media Pipeline — Phase 2

Unified media processing layer: image / voice / OCR / documents / storage
behind a single quality-first `AIRouter`, backed by BullMQ workers and
Postgres history.

## Architecture

```
┌─────────────┐   POST /api/media-pipeline/*   ┌──────────────┐
│  React UI   │ ─────────────────────────────► │  API server  │
│ MediaStudio │ ◄──── SSE /jobs/:id/stream ─── │ (Express+Zod)│
└─────────────┘                                └──────┬───────┘
                                                      │
                                             enqueue  ▼
                                        ┌──────────────────────┐
                                        │  BullMQ (Redis)      │
                                        └──────┬───────────────┘
                                               │ workers
                                               ▼
                                     ┌───────────────────────┐
                                     │  AIRouter             │
                                     │  ├─ OpenAIImage       │
                                     │  ├─ GeminiImage       │
                                     │  ├─ OpenAITTS/STT     │
                                     │  ├─ TesseractOCR      │
                                     │  ├─ DocumentParse     │
                                     │  └─ S3Storage         │
                                     └────────┬──────────────┘
                                              │
                                              ▼
                             ┌────────────────────────────────┐
                             │  Postgres (Drizzle)            │
                             │  media_jobs / media_assets /   │
                             │  media_history                 │
                             └────────────────────────────────┘
```

## Packages

- `lib/media-core` — `IMediaAdapter` interface, Zod schemas, `AIRouter`,
  telemetry types.
- `lib/media-adapters` — concrete adapters (OpenAI, Gemini, Tesseract,
  local parser, AWS S3).
- `lib/media-db` — Drizzle schema + `MediaRepo` + SQL migration.
- `lib/media-workers` — BullMQ queues + one worker per kind.
- `artifacts/api-server/src/routes/media-pipeline.ts` — HTTP endpoints
  (Zod-validated, rate-limited, SSE progress).
- `artifacts/cyber-ai/src/features/media/MediaStudio.tsx` — React UI.

## Environment

```
OPENAI_API_KEY=...
GEMINI_API_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
DATABASE_URL=postgres://...
REDIS_URL=redis://localhost:6379
```

## Running

```bash
pnpm --filter @workspace/media-db migrate
pnpm --filter @workspace/media-workers worker:image &
pnpm --filter @workspace/media-workers worker:voice &
pnpm --filter @workspace/media-workers worker:ocr &
pnpm --filter @workspace/media-workers worker:documents &
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/cyber-ai dev
```

## Endpoints

| Method | Path                                     | Purpose |
|--------|------------------------------------------|---------|
| POST   | `/api/media-pipeline/image`              | Generate image |
| POST   | `/api/media-pipeline/voice/tts`          | Text→speech |
| POST   | `/api/media-pipeline/voice/stt`          | Speech→text |
| POST   | `/api/media-pipeline/ocr`                | OCR image |
| POST   | `/api/media-pipeline/documents`          | Parse PDF/DOCX/XLSX |
| POST   | `/api/media-pipeline/files/sign-upload`  | S3 presigned PUT |
| GET    | `/api/media-pipeline/jobs/:id`           | Job status |
| GET    | `/api/media-pipeline/jobs/:id/stream`    | SSE progress |
| GET    | `/api/media-pipeline/history`            | Recent runs |

All state-changing endpoints return `{ jobId, status: "queued" }` and are
polled or streamed via SSE.

## AIRouter

Quality profiles: `quality-first`, `balanced`, `cost-first`. Per-attempt
timeout + total budget cap. Exponential backoff between attempts. Every
run produces a `TelemetryReport` persisted in `media_history` (adapter id,
provider, latency, per-attempt error info).

## Testing

```bash
pnpm --filter @workspace/media-core test
pnpm --filter @workspace/media-adapters test
```

Router logic (quality ordering + fallback) and per-adapter Zod contracts
are covered. Add e2e tests against a live worker with `docker compose up
redis postgres` before shipping to prod.
