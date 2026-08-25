import type { IAgent, AgentCapability, AgentContext } from "../types/agent.types";
import type { AgentTask } from "../types/task.types";
import type { AgentResult } from "../types/result.types";
import { AgentError, AgentErrorCode } from "./AgentErrors";

/**
 * Abstract base for all agents. Subclasses implement doExecute().
 */
export abstract class AgentBase implements IAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: AgentCapability[];

  async execute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const start = Date.now();
    ctx.monitor.recordAgentStart(this.id);
    ctx.logger.log(this.id, "info", `Starting task ${task.id}`);
    try {
      if (!this.capabilities.includes(task.capability)) {
        throw new AgentError(AgentErrorCode.CapabilityNotSupported, `Agent ${this.id} does not support ${task.capability}`, this.id, task.id);
      }
      const result = await this.doExecute(task, ctx);
      const duration = Date.now() - start;
      ctx.monitor.recordAgentEnd(this.id, result.ok, duration);
      ctx.logger.log(this.id, result.ok ? "info" : "warn", `Task ${task.id} finished`, { ok: result.ok, duration });
      return { ...result, durationMs: duration };
    } catch (err) {
      const duration = Date.now() - start;
      ctx.monitor.recordAgentEnd(this.id, false, duration);
      ctx.logger.log(this.id, "error", `Task ${task.id} failed: ${String(err)}`);
      return { ok: false, error: String(err), durationMs: duration };
    }
  }

  protected abstract doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult>;
}
