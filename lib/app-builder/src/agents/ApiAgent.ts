import { BaseAgent, type AgentContext } from "./BaseAgent";
import { apiSchema } from "../ai/schemas/api.schema";
import { apiSystemPrompt, buildApiPrompt } from "../ai/prompts/api.prompt";

export class ApiAgent extends BaseAgent<typeof apiSchema> {
  readonly name = "ApiAgent";
  readonly task = "api";
  protected schema = apiSchema;
  protected system = apiSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildApiPrompt(ctx.spec);
  }
}
// Generates API client + server function bindings
