/**
 * AI Core — the brain of the platform (Phase 1).
 * Only entry point for user requests.
 *
 *   User → AICore
 *     ↓
 *   TaskManager (plan)
 *     ↓
 *   AIOrchestrator (execute via agents)
 *     ↓
 *   AICore (merge)
 *     ↓
 *   User
 *
 * AICore NEVER calls agents directly.
 */
import type { PlatformResponse, UserRequest } from "../types";
import type { TaskManager } from "../tasks/TaskManager";
import type { AIOrchestrator } from "../orchestrator/AIOrchestrator";
import type { AgentManager } from "../agents/AgentManager";
import type { MemoryManager } from "../memory/MemoryManager";
import type { SearchManager } from "../search/SearchManager";
import type { PlatformMonitor } from "../monitoring/PlatformMonitor";
import type { ScopedLogger } from "../logging/PlatformLogger";
import type { PermissionSystem, Principal } from "../security/PermissionSystem";
import type { RateLimiter } from "../security/RateLimiter";
import type { IIntentAnalyzer } from "./IntentAnalyzer";
import type { ResultMerger } from "./ResultMerger";
import { validateUserRequest } from "../security/InputValidator";

export interface AICoreDeps {
  readonly taskManager: TaskManager;
  readonly orchestrator: AIOrchestrator;
  readonly agentManager: AgentManager;
  readonly memory: MemoryManager;
  readonly search: SearchManager;
  readonly monitor: PlatformMonitor;
  readonly logger: ScopedLogger;
  readonly permissions: PermissionSystem;
  readonly rateLimiter: RateLimiter;
  readonly intentAnalyzer: IIntentAnalyzer;
  readonly merger: ResultMerger;
}

export class AICore {
  constructor(private readonly deps: AICoreDeps) {}

  /**
   * Handle a user request end-to-end.
   * Never throws for expected failures — degraded responses are returned instead.
   */
  async handle(rawRequest: unknown, principal?: Principal): Promise<PlatformResponse> {
    const startedAt = Date.now();
    let req: UserRequest;

    // 1. Validate input
    try {
      req = validateUserRequest(rawRequest);
    } catch (err) {
      this.deps.logger.warn("validation.failed", { err: err instanceof Error ? err.message : String(err) });
      return this.errorResponse("invalid_request", err instanceof Error ? err.message : "invalid request", Date.now() - startedAt);
    }

    // 2. Principal + permissions + rate limit
    const p = principal ?? this.deps.permissions.makePrincipal(req.sessionId, req.userId);
    try {
      this.deps.permissions.require(p, "request.submit");
    } catch (err) {
      return this.errorResponse("forbidden", err instanceof Error ? err.message : "forbidden", Date.now() - startedAt, req.requestId);
    }
    if (!this.deps.rateLimiter.tryConsume(p.userId ?? p.sessionId)) {
      return this.errorResponse("rate_limited", "too many requests, please slow down", Date.now() - startedAt, req.requestId);
    }
    this.deps.monitor.markRequest();
    this.deps.logger.info("request.received", { requestId: req.requestId, sessionId: req.sessionId });

    // 3. Remember user turn
    await this.deps.memory.appendTurn(req.sessionId, { role: "user", content: req.input, ts: Date.now() });

    // 4. Understand intent + complexity
    const intent = await this.deps.intentAnalyzer.analyze(req);
    this.deps.logger.info("intent.analyzed", { requestId: req.requestId, intent: intent.intent, complexity: intent.complexity });

    // 5. Build execution plan
    const plan = this.deps.taskManager.plan(req, intent);
    this.deps.logger.info("plan.built", { requestId: req.requestId, tasks: plan.tasks.length, layers: plan.parallelGroups.length });

    // 6. Execute via orchestrator (agents never called from here)
    const results = await this.deps.orchestrator.execute(plan, req.sessionId, req.signal);

    // 7. Merge results into one professional response
    const response = this.deps.merger.merge({
      requestId: req.requestId,
      results,
      totalDurationMs: Date.now() - startedAt,
    });

    // 8. Remember assistant turn
    await this.deps.memory.appendTurn(req.sessionId, { role: "assistant", content: response.text, ts: Date.now() });

    this.deps.logger.info("request.complete", {
      requestId: req.requestId,
      ok: response.ok,
      durationMs: response.usage.totalDurationMs,
      tasks: response.usage.tasksExecuted,
      agents: response.usage.agentsInvolved,
    });

    return response;
  }

  private errorResponse(code: string, message: string, durationMs: number, requestId = "unknown"): PlatformResponse {
    return {
      requestId,
      ok: false,
      text: message,
      artifacts: [],
      usage: { totalTokens: 0, totalDurationMs: durationMs, tasksExecuted: 0, agentsInvolved: [] },
      warnings: [code],
    };
  }
}
