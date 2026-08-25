import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";
import type { StreamHandler } from "../types/streaming.types";
import { TaskDispatcher } from "./TaskDispatcher";
import { ProviderManager } from "../providers/ProviderManager";
import { PromptManager } from "../prompt/PromptManager";
import { ContextManager } from "../context/ContextManager";
import { RateLimiter } from "../rate-limit/RateLimiter";
import { AICache } from "../cache/AICache";
import { AILogger } from "../logging/AILogger";
import { AIMonitor } from "../monitoring/AIMonitor";
import { RetryManager } from "../reliability/RetryManager";
import { ErrorHandler } from "../reliability/ErrorHandler";
import { StreamingEngine } from "../engine/StreamingEngine";
import { RequestPipeline } from "../engine/RequestPipeline";
import { ResponsePipeline } from "../engine/ResponsePipeline";
import { ExecutionEngine } from "../engine/ExecutionEngine";
import { registerDefaultHandlers } from "../tasks";
import { AI_CONFIG } from "../config/ai.config";
import { AIError, AIErrorCode } from "../types/error.types";

/**
 * AIRouter — the single public entry point to the AI Core.
 * UI code MUST NOT talk to providers/managers directly.
 */
export class AIRouter {
  readonly dispatcher = new TaskDispatcher();
  readonly providers = new ProviderManager();
  readonly prompts = new PromptManager();
  readonly context = new ContextManager();
  readonly rateLimiter = new RateLimiter();
  readonly cache = new AICache();
  readonly logger = new AILogger();
  readonly monitor = new AIMonitor();
  readonly retry = new RetryManager();
  readonly errorHandler = new ErrorHandler();
  readonly streaming = new StreamingEngine();
  readonly requestPipeline = new RequestPipeline();
  readonly responsePipeline = new ResponsePipeline();
  readonly execution = new ExecutionEngine();

  constructor() {
    // Every task handler gets this router's shared `monitor`/`logger` (see
    // tasks/index.ts) so the dashboard reflects every request through a
    // single combined view instead of per-handler silos.
    registerDefaultHandlers(this);
  }

  async execute<TInput = unknown, TData = unknown>(
    req: AIRequest<TInput>,
  ): Promise<AIResponse<TData>> {
    const start = Date.now();
    try {
      const prepared = this.requestPipeline.run(req);
      if (AI_CONFIG.enableRateLimit) this.rateLimiter.enforce(prepared);
      // dispatch() -> BaseTaskHandler.handle() -> FallbackEngine.run(), which
      // already records success/failure per provider attempt on this same
      // `monitor`/`logger` — recording again here would double-count the
      // dashboard's request totals, so this layer only records failures that
      // happen BEFORE a provider is ever reached (validation, rate limiting).
      const raw = await this.dispatcher.dispatch(prepared);
      const finalRes = this.responsePipeline.run(raw);
      return finalRes as AIResponse<TData>;
    } catch (err) {
      this.monitor.recordFailure(Date.now() - start);
      const aiErr = err instanceof AIError ? err : new AIError(AIErrorCode.InternalError, String(err));
      const handled = this.errorHandler.toResponse(aiErr);
      if (AI_CONFIG.enableLogging) this.logger.logError(req, aiErr);
      return handled as AIResponse<TData>;
    }
  }

  async stream<TInput = unknown, TData = unknown>(
    req: AIRequest<TInput>,
    onEvent: StreamHandler<TData>,
  ): Promise<AIResponse<TData>> {
    return this.streaming.run(this, req, onEvent);
  }
}

let _singleton: AIRouter | null = null;
export const getAIRouter = (): AIRouter => {
  if (!_singleton) _singleton = new AIRouter();
  return _singleton;
};
