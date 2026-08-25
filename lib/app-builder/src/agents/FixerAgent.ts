import { BaseAgent, type AgentContext } from "./BaseAgent";
import { fixerSchema } from "../ai/schemas/fixer.schema";
import { fixerSystemPrompt, buildFixerPrompt } from "../ai/prompts/fixer.prompt";

export class FixerAgent extends BaseAgent<typeof fixerSchema> {
  readonly name = "FixerAgent";
  readonly task = "fixer";
  protected schema = fixerSchema;
  protected system = fixerSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildFixerPrompt(ctx.spec);
  }
}
// Applies fixes to reviewed issues
