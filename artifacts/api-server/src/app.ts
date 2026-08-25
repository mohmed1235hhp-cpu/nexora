/**
 * Express application setup — production hardened.
 * - Helmet with strict CSP
 * - CORS with explicit allowlist
 * - Env validation (fail-fast at boot)
 * - Structured request logging with correlation IDs
 * - Global rate limiting
 * - Cookie parsing for future httpOnly session migration
 */
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import router from "./routes";
import { logger } from "./lib/logger";
import { env } from "./lib/env";
import { apiLimiter } from "./middlewares/rateLimit";
import { issueCsrf, requireCsrf } from "./middlewares/csrf";
import { createErrorMiddleware } from "@workspace/core/errors";

const app: Express = express();

// Trust proxy — required for accurate req.ip and Secure cookies behind a reverse proxy.
app.set("trust proxy", 1);

// Correlation IDs on every request for distributed tracing.
app.use((req, _res, next) => {
  const incoming = req.headers["x-request-id"];
  (req as express.Request & { id?: string }).id =
    typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  next();
});

// Structured request logging
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as express.Request & { id?: string }).id ?? randomUUID(),
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0], // strip query params from logs
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Helmet — sensible defaults + custom CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow embedding public assets
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts:
      env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  }),
);
app.disable("x-powered-by");

// CORS
const ALLOWED_ORIGINS = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : env.NODE_ENV === "production"
    ? [] // hard-deny cross-origin in prod if no allowlist configured
    : true;

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 86400,
  }),
);

app.use(cookieParser());

// Payment webhooks MUST see the raw body for HMAC/signature verification.
// Mount SYNCHRONOUSLY, BEFORE express.json, urlencoded, CSRF and the global
// rate limiter — otherwise the JSON parser consumes the stream first and
// signature checks always fail (a real production outage: providers keep
// retrying and every event is rejected). Static import avoids the race
// window the previous dynamic `import().then()` created at boot.
//
// The webhook router itself lives at POST /api/webhooks/:provider and reads
// the buffered raw body from req.body (Buffer). It performs its own JSON
// parse only AFTER signature verification.
import webhooksRouter from "./routes/webhooks";
app.use(
  "/api/webhooks",
  express.raw({ type: "*/*", limit: "1mb" }),
  webhooksRouter,
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(issueCsrf);

// Global rate limit — skip liveness/readiness probes only.
app.use("/api", (req, res, next) => {
  const skipPaths = ["/healthz", "/readyz", "/ping"];
  if (skipPaths.includes(req.path)) return next();
  return apiLimiter(req as Parameters<typeof apiLimiter>[0], res, next);
});
app.use("/api", requireCsrf);

app.use("/api", router);


// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler — see @workspace/core/errors for the AppError hierarchy.
// Never leaks stack traces or internal error messages for non-AppError failures.
app.use(createErrorMiddleware({ logger }));

export default app;
