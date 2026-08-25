import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";
import type { TaskType } from "../types/task.types";
import type { ProviderManager } from "../providers/ProviderManager";
import { RouteResolver } from "../router/RouteResolver";
import { FallbackEngine } from "../reliability/FallbackEngine";
import { AIMonitor } from "../monitoring/AIMonitor";
import { AILogger } from "../logging/AILogger";

export abstract class BaseTaskHandler {
  abstract readonly task: TaskType;
  protected resolver = new RouteResolver();
  protected fallback: FallbackEngine;

  constructor(
    protected providers: ProviderManager,
    monitor: AIMonitor = new AIMonitor(),
    logger: AILogger = new AILogger(),
  ) {
    this.fallback = new FallbackEngine(providers, monitor, logger);
  }

  async handle(req: AIRequest): Promise<AIResponse> {
    const capability = this.resolver.resolveCapability(this.task);
    // Routes through the full primary -> secondary -> fallback chain with
    // retry-once-per-tier, instead of calling a single resolved provider —
    // see FallbackEngine for the automatic-failover behavior.
    return this.fallback.run(capability, req);
  }
}
