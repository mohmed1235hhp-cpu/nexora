import { BaseAgent, type AgentContext } from "./BaseAgent";
import { validationSchema } from "../ai/schemas/validation.schema";
import { validationSystemPrompt, buildValidationPrompt } from "../ai/prompts/validation.prompt";

export class ValidationAgent extends BaseAgent<typeof validationSchema> {
  readonly name = "ValidationAgent";
  readonly task = "validation";
  protected schema = validationSchema;
  protected system = validationSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildValidationPrompt(ctx.spec);
  }
}
// Generates zod validators
