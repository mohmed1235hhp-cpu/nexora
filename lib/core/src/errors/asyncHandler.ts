import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * `next(err)` instead of crashing the process or hanging the request.
 *
 * Before:
 *   router.get("/x", async (req, res) => {
 *     try { ... } catch (err) { res.status(500).json({ error: "..." }); }
 *   });
 *
 * After:
 *   router.get("/x", asyncHandler(async (req, res) => { ... }));
 *   // throw a NotFoundError / ValidationError / etc — the global
 *   // error middleware (see errorMiddleware.ts) handles the response.
 */
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
}
