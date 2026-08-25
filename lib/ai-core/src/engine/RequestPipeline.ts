import type { AIRequest } from "../types/request.types";

/** Normalizes and enriches incoming requests before dispatch. */
export class RequestPipeline {
  run<T>(req: AIRequest<T>): AIRequest<T> {
    return {
      ...req,
      meta: {
        requestId: req.meta?.requestId ?? crypto.randomUUID(),
        stream: req.meta?.stream ?? false,
        ...req.meta,
      },
    };
  }
}
