import { BaseAgent, type AgentContext } from "./BaseAgent";
import { uiSchema } from "../ai/schemas/ui.schema";
import { uiSystemPrompt, buildUiPrompt } from "../ai/prompts/ui.prompt";

export class UIAgent extends BaseAgent<typeof uiSchema> {
  readonly name = "UIAgent";
  readonly task = "ui";
  protected schema = uiSchema;
  protected system = uiSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildUiPrompt(ctx.spec);
  }
}
// Generates screens, components, and layouts
