import type { AgentTask } from "../types/task.types";
import type { AgentContext, IAgent } from "../types/agent.types";
import type { AgentResult } from "../types/result.types";
import { AgentRegistry } from "./AgentRegistry";
import { CapabilityRegistry } from "./CapabilityRegistry";
import { AgentError, AgentErrorCode } from "../core/AgentErrors";

export class TaskScheduler {
  constructor(
    private agentRegistry: AgentRegistry,
    private capabilityRegistry: CapabilityRegistry,
  ) {}

  async dispatchTask(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    const agentId = task.assignedAgentId ?? this.capabilityRegistry.getBestAgent(task.capability);
    if (!agentId) {
      throw new AgentError(AgentErrorCode.CapabilityNotSupported, `No agent for capability: ${task.capability}`);
    }
    const agent = this.agentRegistry.get(agentId);
    return agent.execute(task, ctx);
  }

  async dispatchParallel(tasks: AgentTask[], ctx: AgentContext): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();
    const promises = tasks.map(async t => {
      const res = await this.dispatchTask(t, ctx);
      results.set(t.id, res);
    });
    await Promise.all(promises);
    return results;
  }
}
