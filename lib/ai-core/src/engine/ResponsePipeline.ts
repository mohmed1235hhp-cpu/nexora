import type { AIResponse } from "../types/response.types";

/** Normalizes provider responses before returning to callers. */
export class ResponsePipeline {
  run<T>(res: AIResponse<T>): AIResponse<T> {
    return { ...res };
  }
}
