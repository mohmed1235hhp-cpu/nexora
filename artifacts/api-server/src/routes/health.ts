/**
 * Health & readiness endpoints.
 * - /healthz  → liveness (process up)
 * - /readyz   → readiness (dependencies reachable: DB)
 */
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// NOTE: /healthz is served by ./monitoring (richer payload: uptime, version,
// service breakdown). This router only owns /readyz to avoid two competing
// implementations of the same path.

router.get("/readyz", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: "ready", db: "ok" });
  } catch (err) {
    logger.error({ err }, "readyz db check failed");
    res.status(503).json({ status: "not_ready", db: "error" });
  }
});

export default router;
