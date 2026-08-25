import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";

export class LogFormatter {
  formatRequest(req: AIRequest): string {
    return `[AI] task=${req.task} requestId=${req.meta?.requestId ?? "-"}`;
  }
  formatResponse(res: AIResponse): string {
    return `[AI] ok=${res.ok} provider=${res.providerId ?? "-"} latency=${res.usage?.latencyMs ?? "-"}ms`;
  }
}
