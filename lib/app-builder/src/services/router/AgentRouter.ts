import type { IAgent, AgentContext, AgentOutput } from "../agents/IAgent";
import { err, ok, type Result } from "../../core/result/Result";
import { AgentError } from "../../core/errors/AppBuilderError";
import { globalBus } from "../../core/events/EventBus";

export class AgentRouter {
  private agents = new Map<string, IAgent>();
  register(agent: IAgent): void { this.agents.set(agent.name, agent); }
  list(): string[] { return [...this.agents.keys()]; }
  async dispatch(name: string, ctx: AgentContext): Promise<Result<AgentOutput>> {
    const agent = this.agents.get(name);
    if (!agent) return err(new AgentError(`Agent not found: ${name}`));
    globalBus.emit("agent:start", { name, ctx });
    const res = await agent.run(ctx);
    globalBus.emit(res.ok ? "agent:done" : "agent:error", { name, res });
    return res;
  }
}
export const agentRouter = new AgentRouter();
