/**
 * AI Orchestrator — Phase 1.
 * Only entity allowed to invoke agents. Handles:
 *   - agent discovery via AgentManager
 *   - parallel + sequential execution based on plan.parallelGroups
 *   - retry once, then fallback to backup agent, then graceful continue
 *   - circuit breaker per agent
 *   - metrics + logs
 *
 * Never returns to user directly. Returns TaskResult[] to AI Core.
 */
import type { ExecutionPlan, Task, TaskResult } from "../types";
import type { AgentManager, IAgentAdapter } from "../agents/AgentManager";
import type { PlatformMonitor } from "../monitoring/PlatformMonitor";
import type { ScopedLogger } from "../logging/PlatformLogger";
import type { SandboxManager } from "../sandbox/AgentSandbox";
import { CircuitBreaker } from "../reliability/CircuitBreaker";
import { withRetry } from "../reliability/RetryPolicy";

export interface AIOrchestratorDeps {
  readonly agentManager: AgentManager;
  readonly sandboxes: SandboxManager;
  readonly monitor: PlatformMonitor;
  readonly logger: ScopedLogger;
}

export class AIOrchestrator {
  private readonly breaker = new CircuitBreaker();
  constructor(private readonly deps: AIOrchestratorDeps) {}

  async execute(plan: ExecutionPlan, sessionId: string, signal?: AbortSignal): Promise<readonly TaskResult[]> {
    const results = new Map<string, TaskResult>();
    this.deps.logger.info("plan.start", { planId: plan.planId, intent: plan.intent.intent, tasks: plan.tasks.length });

    for (const layer of plan.parallelGroups) {
      if (signal?.aborted) throw new Error("aborted");
      const layerTasks = layer.map((id) => plan.tasks.find((t) => t.id === id)!).filter(Boolean);
      const layerResults = await Promise.all(layerTasks.map((t) => this.runTask(t, sessionId, signal)));
      for (const r of layerResults) results.set(r.taskId, r);
    }

    this.deps.logger.info("plan.done", { planId: plan.planId, results: results.size });
    return Array.from(results.values());
  }

  private async runTask(task: Task, sessionId: string, signal?: AbortSignal): Promise<TaskResult> {
    const startedAt = Date.now();
    let retries = 0;

    const agent = this.pickAgent(task);
    if (!agent) {
      this.deps.logger.warn("task.no_agent", { taskId: task.id, capability: task.capability });
      return this.errorResult(task, startedAt, "no_agent", `no agent for capability ${task.capability}`, "-", 0);
    }

    this.deps.monitor.markAgentStart(agent.id);
    this.deps.monitor.markQueueDelta(1);

    try {
      const output = await this.invokeWithFallback(task, agent, sessionId, signal, (r) => (retries = r));
      const finishedAt = Date.now();
      this.deps.monitor.markAgentEnd(agent.id, finishedAt - startedAt, true, retries);
      return { taskId: task.id, agentId: agent.id, ok: true, output, startedAt, finishedAt, retries };
    } catch (err) {
      const finishedAt = Date.now();
      this.deps.monitor.markAgentEnd(agent.id, finishedAt - startedAt, false, retries);
      const msg = err instanceof Error ? err.message : String(err);
      this.deps.logger.error("task.failed", { taskId: task.id, agentId: agent.id, err: msg });
      return this.errorResult(task, startedAt, "task_failed", msg, agent.id, retries);
    } finally {
      this.deps.monitor.markQueueDelta(-1);
    }
  }

  private pickAgent(task: Task): IAgentAdapter | undefined {
    const candidates = this.deps.agentManager.discover(task.capability);
    for (const c of candidates) {
      if (this.breaker.canPass(c.id)) return c;
    }
    return candidates[0]; // even if breaker is open, try once to update state
  }

  private async invokeWithFallback(
    task: Task,
    primary: IAgentAdapter,
    sessionId: string,
    signal: AbortSignal | undefined,
    onRetryCount: (r: number) => void,
  ): Promise<unknown> {
    const attempt = async (agent: IAgentAdapter): Promise<unknown> => {
      const sb = this.deps.sandboxes.getOrCreate(agent.id, sessionId);
      sb.log(`invoke ${task.name}`);
      let attemptCount = 0;
      const result = await withRetry(
        async () => {
          attemptCount += 1;
          onRetryCount(attemptCount - 1);
          return agent.execute(task.input, { sessionId, signal });
        },
        { maxAttempts: task.retriable === false ? 1 : 2, baseDelayMs: 200, maxDelayMs: 2_000, jitter: 0.2 },
        signal,
      );
      this.breaker.reportSuccess(agent.id);
      return result;
    };

    try {
      return await attempt(primary);
    } catch (primaryErr) {
      this.breaker.reportFailure(primary.id);
      const backupId = primary.descriptor.backupAgentId;
      const backup = backupId ? this.deps.agentManager.tryGet(backupId) : undefined;
      if (backup) {
        this.deps.logger.warn("task.fallback_to_backup", { primary: primary.id, backup: backup.id });
        try {
          return await attempt(backup);
        } catch (backupErr) {
          this.breaker.reportFailure(backup.id);
          this.deps.logger.warn("task.backup_failed_graceful", {
            primary: primary.id,
            backup: backup.id,
            error: backupErr instanceof Error ? backupErr.message : String(backupErr),
          });
          return { degraded: true, reason: "backup_failed", partial: null };
        }
      }
      this.deps.logger.warn("task.graceful", { primary: primary.id, error: primaryErr instanceof Error ? primaryErr.message : String(primaryErr) });
      return { degraded: true, reason: "primary_failed", partial: null };
    }
  }

  private errorResult(task: Task, startedAt: number, code: string, message: string, agentId: string, retries: number): TaskResult {
    return {
      taskId: task.id,
      agentId,
      ok: false,
      error: { code, message },
      startedAt,
      finishedAt: Date.now(),
      retries,
    };
  }

  circuitState(): Readonly<Record<string, string>> {
    return this.breaker.snapshot();
  }
}
