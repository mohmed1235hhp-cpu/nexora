import type { Result } from "../../core/result/Result";
export interface AgentContext { requestId: string; buildId: string; payload?: unknown; }
export interface AgentOutput { name: string; artifacts?: unknown; notes?: string; }
export interface IAgent {
  readonly name: string;
  run(ctx: AgentContext): Promise<Result<AgentOutput>>;
}
