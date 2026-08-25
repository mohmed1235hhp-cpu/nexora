import { BaseAgent, type AgentContext } from "./BaseAgent";
import { stateSchema } from "../ai/schemas/state.schema";
import { stateSystemPrompt, buildStatePrompt } from "../ai/prompts/state.prompt";

export class StateAgent extends BaseAgent<typeof stateSchema> {
  readonly name = "StateAgent";
  readonly task = "state";
  protected schema = stateSchema;
  protected system = stateSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildStatePrompt(ctx.spec);
  }
}
// Generates state slices, stores, contexts
