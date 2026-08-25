import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";
import type { StreamHandler } from "../types/streaming.types";
import type { AIRouter } from "../router/AIRouter";

export class StreamingEngine {
  async run<TInput, TData>(
    router: AIRouter,
    req: AIRequest<TInput>,
    onEvent: StreamHandler<TData>,
  ): Promise<AIResponse<TData>> {
    onEvent({ type: "start" });
    const res = await router.execute<TInput, TData>({
      ...req,
      meta: { ...req.meta, stream: true },
    });
    if (res.ok) onEvent({ type: "chunk", data: res.data });
    onEvent({ type: "end" });
    return res;
  }
}
