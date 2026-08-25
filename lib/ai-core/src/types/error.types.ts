export const AIErrorCode = {
  ProviderNotConfigured: "provider-not-configured",
  ProviderUnavailable: "provider-unavailable",
  CapabilityUnsupported: "capability-unsupported",
  RateLimited: "rate-limited",
  Timeout: "timeout",
  Cancelled: "cancelled",
  ValidationFailed: "validation-failed",
  InternalError: "internal-error",
  Unknown: "unknown",
} as const;

export type AIErrorCode = (typeof AIErrorCode)[keyof typeof AIErrorCode];

export class AIError extends Error {
  code: AIErrorCode;
  details?: unknown;
  constructor(code: AIErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.details = details;
  }
}
