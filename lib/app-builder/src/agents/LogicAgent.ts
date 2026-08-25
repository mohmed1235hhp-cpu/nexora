import { BaseAgent, type AgentContext } from "./BaseAgent";
import { logicSchema } from "../ai/schemas/logic.schema";
import { logicSystemPrompt, buildLogicPrompt } from "../ai/prompts/logic.prompt";

export class LogicAgent extends BaseAgent<typeof logicSchema> {
  readonly name = "LogicAgent";
  readonly task = "logic";
  protected schema = logicSchema;
  protected system = logicSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildLogicPrompt(ctx.spec);
  }
}
// Generates business logic modules
