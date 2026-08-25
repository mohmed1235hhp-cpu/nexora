/**
 * Stable, machine-readable error codes.
 *
 * These are part of the public API contract with the frontend — treat
 * renaming or removing a value as a breaking change. Add new codes rather
 * than reusing old ones for a different meaning.
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  INTERNAL_ERROR = "INTERNAL_ERROR",

  // Domain-specific codes — add here as new modules need them.
  USERNAME_TAKEN = "USERNAME_TAKEN",
  EMAIL_TAKEN = "EMAIL_TAKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ACCOUNT_BANNED = "ACCOUNT_BANNED",
  INVALID_CURRENT_PASSWORD = "INVALID_CURRENT_PASSWORD",
}
