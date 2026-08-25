/**
 * Unified application error hierarchy.
 *
 * Every intentional error thrown anywhere in the backend should extend
 * `AppError` so the global error middleware (see `errorMiddleware.ts`) can:
 *  - map it to the correct HTTP status code
 *  - return a stable machine-readable `code` the frontend can switch on
 *  - decide whether the message is safe to show to the end user
 *  - log it with the right severity
 *
 * Do NOT throw plain `Error` or `new Error("...")` for expected conditions
 * (validation failures, not-found, auth failures, etc). Reserve unexpected
 * `Error`s for genuine bugs — the middleware treats those as 500s and never
 * leaks their message to the client.
 */
import { ErrorCode } from "./errorCodes";

export interface AppErrorOptions {
  /** Machine-readable code the client can branch on. Defaults per subclass. */
  code?: ErrorCode;
  /** Extra structured context for logs only — never sent to the client. */
  context?: Record<string, unknown>;
  /** Original error being wrapped, if any (preserved for logging/cause chain). */
  cause?: unknown;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly context?: Record<string, unknown>;
  /** Safe to display to the end user as-is. */
  readonly isOperational = true;

  constructor(message: string, statusCode: number, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = options.code ?? ErrorCode.INTERNAL_ERROR;
    this.context = options.context;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", options: AppErrorOptions = {}) {
    super(message, 400, { code: ErrorCode.VALIDATION_ERROR, ...options });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", options: AppErrorOptions = {}) {
    super(message, 401, { code: ErrorCode.UNAUTHORIZED, ...options });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", options: AppErrorOptions = {}) {
    super(message, 403, { code: ErrorCode.FORBIDDEN, ...options });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", options: AppErrorOptions = {}) {
    super(message, 404, { code: ErrorCode.NOT_FOUND, ...options });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", options: AppErrorOptions = {}) {
    super(message, 409, { code: ErrorCode.CONFLICT, ...options });
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", options: AppErrorOptions = {}) {
    super(message, 429, { code: ErrorCode.RATE_LIMITED, ...options });
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error", options: AppErrorOptions = {}) {
    super(message, 500, { code: ErrorCode.INTERNAL_ERROR, ...options });
  }
}

/** Type guard used by the error middleware. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
