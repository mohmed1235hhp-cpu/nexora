import { BaseAgent, type AgentContext } from "./BaseAgent";
import { reviewerSchema } from "../ai/schemas/reviewer.schema";
import { reviewerSystemPrompt, buildReviewerPrompt } from "../ai/prompts/reviewer.prompt";

export class ReviewerAgent extends BaseAgent<typeof reviewerSchema> {
  readonly name = "ReviewerAgent";
  readonly task = "reviewer";
  protected schema = reviewerSchema;
  protected system = reviewerSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildReviewerPrompt(ctx.spec);
  }
}
// Reviews outputs for issues
