/**
 * Phase 20 — Monitoring, Health Checks, Metrics
 */
import { Router, Response, Request } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";
import os from "os";

const router = Router();
const startTime = Date.now();

// Request counter (in-memory)
const metrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsError: 0,
  responseTimes: [] as number[],
};

export function incrementRequests(success: boolean, ms: number) {
  metrics.requestsTotal++;
  if (success) metrics.requestsSuccess++;
  else metrics.requestsError++;
  metrics.responseTimes.push(ms);
  if (metrics.responseTimes.length > 1000) metrics.responseTimes.shift();
}

function avgResponseTime() {
  if (!metrics.responseTimes.length) return 0;
  return metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
}

// GET /api/healthz - detailed health check
router.get("/healthz", async (req: Request, res: Response) => {
  const uptimeMs = Date.now() - startTime;
  let dbStatus = "ok";
  let dbLatency = 0;

  try {
    const t0 = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - t0;
  } catch {
    dbStatus = "error";
  }

  const health = {
    status: dbStatus === "ok" ? "healthy" : "degraded",
    version: process.env.npm_package_version || "0.1.0",
    uptime: Math.floor(uptimeMs / 1000),
    uptimeHuman: `${Math.floor(uptimeMs / 3600000)}h ${Math.floor((uptimeMs % 3600000) / 60000)}m`,
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      api: {
        status: "ok",
      },
    },
  };

  const statusCode = health.status === "healthy" ? 200 : 503;
  return res.status(statusCode).json(health);
});

// GET /api/metrics - Prometheus-style metrics
// SECURITY: exposes host OS/CPU/memory details and Node runtime info, so it
// must not be publicly reachable — previously had no auth guard at all.
router.get("/metrics", requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptimeMs = Date.now() - startTime;

  const data = {
    uptime_seconds: Math.floor(uptimeMs / 1000),
    requests_total: metrics.requestsTotal,
    requests_success: metrics.requestsSuccess,
    requests_error: metrics.requestsError,
    avg_response_time_ms: Math.round(avgResponseTime()),
    memory: {
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memUsage.external / 1024 / 1024),
    },
    cpu: {
      user_ms: Math.round(cpuUsage.user / 1000),
      system_ms: Math.round(cpuUsage.system / 1000),
    },
    os: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      total_mem_mb: Math.round(os.totalmem() / 1024 / 1024),
      free_mem_mb: Math.round(os.freemem() / 1024 / 1024),
      load_avg: os.loadavg(),
    },
    node: {
      version: process.version,
      pid: process.pid,
    },
  };

  return res.json(data);
});

// GET /api/ping - simple liveness
router.get("/ping", (_req: Request, res: Response) => {
  return res.json({ pong: true, ts: Date.now() });
});

export default router;
