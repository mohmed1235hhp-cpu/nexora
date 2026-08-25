import { pgTable, uuid, text, timestamp, jsonb, integer, index } from "drizzle-orm/pg-core";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    kind: text("kind").notNull(), // image | audio | video | document
    mimeType: text("mime_type").notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url"),
    sizeBytes: integer("size_bytes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("media_assets_user_idx").on(t.userId),
    kindIdx: index("media_assets_kind_idx").on(t.kind),
  }),
);

export const mediaJobs = pgTable(
  "media_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    kind: text("kind").notNull(), // image | tts | stt | ocr | document
    status: text("status").notNull(), // queued | running | completed | failed | cancelled
    input: jsonb("input").$type<Record<string, unknown>>().notNull(),
    output: jsonb("output").$type<Record<string, unknown>>(),
    error: text("error"),
    progress: integer("progress").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("media_jobs_user_idx").on(t.userId),
    statusIdx: index("media_jobs_status_idx").on(t.status),
  }),
);

export const mediaHistory = pgTable(
  "media_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    jobId: uuid("job_id"),
    assetId: uuid("asset_id"),
    kind: text("kind").notNull(),
    adapterId: text("adapter_id").notNull(),
    provider: text("provider").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    costUsd: integer("cost_usd_micro").notNull().default(0), // stored as micro-USD
    telemetry: jsonb("telemetry").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("media_history_user_idx").on(t.userId),
    createdIdx: index("media_history_created_idx").on(t.createdAt),
  }),
);

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type MediaJob = typeof mediaJobs.$inferSelect;
export type MediaHistoryRow = typeof mediaHistory.$inferSelect;
