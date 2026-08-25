import type { IAgent, AgentContext, AgentOutput } from "./IAgent";
import { ok, type Result } from "../../core/result/Result";
export class StorageAgent implements IAgent {
  readonly name = "StorageAgent";
  async run(ctx: AgentContext): Promise<Result<AgentOutput>> {
    return ok({ name: this.name, notes: "Storage stub for request " + ctx.requestId });
  }
}
export const storageAgent = new StorageAgent();
