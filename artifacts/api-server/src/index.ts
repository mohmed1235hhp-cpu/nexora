import { logger } from "./lib/logger";
import { initTelemetry } from "./lib/otel";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  // Must start before `app` (and its transitive deps: express, drizzle, etc.)
  // are imported — OTel's auto-instrumentations patch modules at require
  // time, so importing app first would leave those modules uninstrumented.
  await initTelemetry();

  const { default: app } = await import("./app");

  // Background job workers (video/website/app generation) — see
  // lib/jobs.ts and routes/jobs.ts. Registered once per process; the
  // in-memory queue driver lives in this same process, the BullMQ driver
  // (QUEUE_DRIVER=bullmq) would normally run in a separate worker process,
  // but registering here too is harmless (BullMQ workers are idempotent
  // per queue name) and keeps local/dev setup zero-config.
  const { registerAllJobWorkers } = await import("./lib/jobWorkers");
  registerAllJobWorkers();

  const server = app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });

  // Graceful shutdown — SIGTERM (k8s / docker stop) drains in-flight
  // requests before the process exits. SIGINT covers local Ctrl-C.
  const shutdown = (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, draining");
    const timeout = setTimeout(() => {
      logger.error("Forced shutdown after 15s grace period");
      process.exit(1);
    }, 15_000);
    // Don't hold the event loop open if there is nothing else pending.
    timeout.unref?.();
    server.close((err) => {
      if (err) {
        logger.error({ err }, "Error during server close");
        process.exit(1);
      }
      logger.info("Server closed cleanly");
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception — process will exit");
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal error during server startup");
  process.exit(1);
});
