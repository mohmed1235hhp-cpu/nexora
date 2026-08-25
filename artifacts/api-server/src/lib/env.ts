/**
 * Environment variable validation — fail-fast on startup.
 * Prevents deployments with missing secrets or misconfigured settings.
 *
 * Production hardening: in NODE_ENV=production the schema requires
 * MASTER_ENCRYPTION_KEY, COOKIE_SECURE=true, at least one production
 * ALLOWED_ORIGIN (no localhost), QUEUE_DRIVER=bullmq, STORAGE_DRIVER != local,
 * and SENTRY_DSN / OTEL_EXPORTER_OTLP_ENDPOINT for observability.
 */
import { z } from "zod";

const DriverEnum = <T extends readonly [string, ...string[]]>(vals: T) =>
  z.enum(vals);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid URL" }),
    SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 7),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    ALLOWED_ORIGINS: z.string().optional(),
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: z.coerce.boolean().default(false),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    REDIS_URL: z.string().url().optional(),

    // Observability
    SENTRY_DSN: z.string().url().optional(),
    VITE_SENTRY_DSN: z.string().url().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

    // Secrets
    MASTER_ENCRYPTION_KEY: z
      .string()
      .refine(
        (v) => !v || /^[A-Za-z0-9+/=]{40,}$/.test(v),
        "MASTER_ENCRYPTION_KEY must be base64 (openssl rand -base64 32)",
      )
      .optional(),

    // Password hashing
    ARGON2_MEMORY_KB: z.coerce.number().int().positive().default(65536),
    ARGON2_ITERATIONS: z.coerce.number().int().positive().default(3),
    ARGON2_PARALLELISM: z.coerce.number().int().positive().default(4),

    // Free demo AI — no paid provider key required in DEMO_MODE.
    DEMO_MODE: z.coerce.boolean().default(false),
    DEMO_INFERENCE_URL: z.string().url().optional(),
    DEMO_MODEL: z.string().optional(),

    // AI providers — optional so the server still boots without them;
    // routes/ai.ts throws a clear per-call error if a key is missing when used.
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODEL: z.string().optional(),
    TOGETHER_API_KEY: z.string().optional(),
    TOGETHER_IMAGE_MODEL: z.string().optional(),
    TOGETHER_EDIT_MODEL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().optional(),
    REPLICATE_API_TOKEN: z.string().optional(),
    REPLICATE_VIDEO_MODEL: z.string().optional(),

    // Infrastructure drivers
    QUEUE_DRIVER: DriverEnum(["memory", "bullmq"] as const).default("memory"),
    STORAGE_DRIVER: DriverEnum(["local", "s3", "r2", "supabase"] as const).default(
      "local",
    ),
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_REGION: z.string().optional(),
    STORAGE_ENDPOINT: z.string().optional(),
    STORAGE_ACCESS_KEY_ID: z.string().optional(),
    STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
    STORAGE_LOCAL_ROOT: z.string().optional(),
    STORAGE_PUBLIC_URL: z.string().optional(),
    CDN_BASE_URL: z.string().optional(),

    // Pool
    PG_POOL_MAX: z.coerce.number().int().positive().default(10),
    PG_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
    PG_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    PG_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") return;

    const need = (path: string, cond: boolean, message: string) => {
      if (!cond)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };

    need(
      "MASTER_ENCRYPTION_KEY",
      !!data.MASTER_ENCRYPTION_KEY,
      "MASTER_ENCRYPTION_KEY is required in production (openssl rand -base64 32)",
    );
    need(
      "COOKIE_SECURE",
      data.COOKIE_SECURE === true,
      "COOKIE_SECURE must be true in production",
    );

    const origins = (data.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    need(
      "ALLOWED_ORIGINS",
      origins.length > 0 &&
        origins.every((o) => /^https:\/\//.test(o) && !/localhost|127\.0\.0\.1/.test(o)),
      "ALLOWED_ORIGINS must be a comma-separated list of https:// production origins (no localhost)",
    );

    need(
      "QUEUE_DRIVER",
      data.QUEUE_DRIVER === "bullmq" && !!data.REDIS_URL,
      "QUEUE_DRIVER must be 'bullmq' and REDIS_URL must be set in production",
    );
    need(
      "STORAGE_DRIVER",
      data.STORAGE_DRIVER === "s3" || data.STORAGE_DRIVER === "r2" || data.STORAGE_DRIVER === "supabase",
      "STORAGE_DRIVER must be s3 | r2 | supabase in production (not local/memory)",
    );
    need(
      "SENTRY_DSN",
      !!data.SENTRY_DSN,
      "SENTRY_DSN is required in production",
    );
    need(
      "OTEL_EXPORTER_OTLP_ENDPOINT",
      !!data.OTEL_EXPORTER_OTLP_ENDPOINT,
      "OTEL_EXPORTER_OTLP_ENDPOINT is required in production",
    );
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Do not print values — only which keys failed and why.
    const issues = parsed.error.issues
      .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`[env] invalid or missing environment variables:\n${issues}`);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}

export const env: Env = loadEnv();
