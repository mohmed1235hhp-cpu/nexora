import { BaseAgent, type AgentContext } from "./BaseAgent";
import { navigationSchema } from "../ai/schemas/navigation.schema";
import { navigationSystemPrompt, buildNavigationPrompt } from "../ai/prompts/navigation.prompt";

export class NavigationAgent extends BaseAgent<typeof navigationSchema> {
  readonly name = "NavigationAgent";
  readonly task = "navigation";
  protected schema = navigationSchema;
  protected system = navigationSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildNavigationPrompt(ctx.spec);
  }
}
// Generates navigation graph and routes
