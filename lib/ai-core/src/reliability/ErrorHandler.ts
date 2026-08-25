import { AIError, AIErrorCode } from "../types/error.types";
import type { AIResponse } from "../types/response.types";

export class ErrorHandler {
  toResponse(err: unknown): AIResponse {
    if (err instanceof AIError) {
      return { ok: false, errorCode: err.code, errorMessage: err.message };
    }
    return {
      ok: false,
      errorCode: AIErrorCode.Unknown,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
