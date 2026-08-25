import { BaseAgent, type AgentContext } from "./BaseAgent";
import { assetsSchema } from "../ai/schemas/assets.schema";
import { assetsSystemPrompt, buildAssetsPrompt } from "../ai/prompts/assets.prompt";

export class AssetsAgent extends BaseAgent<typeof assetsSchema> {
  readonly name = "AssetsAgent";
  readonly task = "assets";
  protected schema = assetsSchema;
  protected system = assetsSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildAssetsPrompt(ctx.spec);
  }
}
// Generates asset manifests and imports
