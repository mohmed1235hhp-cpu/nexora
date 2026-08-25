/**
 * Generic Zod validation middleware.
 * Attach to any Express route to validate body / query / params against a
 * schema. On failure returns 400 with a structured error payload — never
 * a raw Zod error to avoid leaking internal shape.
 *
 * Usage:
 *   router.post("/register", validate({ body: RegisterSchema }), handler)
 */
import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny, ZodError } from "zod";

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatIssues(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    code: i.code,
    message: i.message,
  }));
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid request body",
            issues: formatIssues(parsed.error),
          });
        }
        req.body = parsed.data;
      }
      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid query parameters",
            issues: formatIssues(parsed.error),
          });
        }
        // Do not mutate req.query (read-only in Express 5); expose parsed data.
        (req as Request & { validatedQuery?: unknown }).validatedQuery = parsed.data;
      }
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid path parameters",
            issues: formatIssues(parsed.error),
          });
        }
        (req as Request & { validatedParams?: unknown }).validatedParams = parsed.data;
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
