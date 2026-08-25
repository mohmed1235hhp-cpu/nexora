import type { ErrorRequestHandler, Request } from "express";
import { AppError, isAppError } from "./AppError";
import { ErrorCode } from "./errorCodes";

/** Minimal logger shape — satisfied by pino, console, or any DI logger. */
export interface ErrorLogger {
  error(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
}

export interface ErrorMiddlewareOptions {
  logger: ErrorLogger;
}

/**
 * Creates the single global Express error-handling middleware.
 * Must be registered last, after all routes (`app.use(createErrorMiddleware(...))`).
 *
 * - `AppError` instances (and subclasses) → their own statusCode/code/message.
 * - Anything else (bugs, driver errors, etc) → generic 500, message never leaked.
 */
export function createErrorMiddleware({ logger }: ErrorMiddlewareOptions): ErrorRequestHandler {
  return (err, req, res, _next) => {
    const reqId = (req as Request & { id?: string }).id;

    if (isAppError(err)) {
      const level = err.statusCode >= 500 ? "error" : "warn";
      logger[level]({ err, reqId, code: err.code, context: err.context }, err.message);

      res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        requestId: reqId,
      });
      return;
    }

    // Unexpected error — log full detail server-side, leak nothing to the client.
    logger.error({ err, reqId }, "Unhandled error");
    res.status(500).json({
      error: "Internal server error",
      code: ErrorCode.INTERNAL_ERROR,
      requestId: reqId,
    });
  };
}
