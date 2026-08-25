import type { Workflow } from "../../types/workflow.types";
import { WorkflowBuilder } from "../WorkflowBuilder";

export const codeReviewFlow: Workflow = new WorkflowBuilder("preset-code-review")
  .setName("Code Review Pipeline")
  .addStep("review", "review")
  .addStep("security", "security-analysis", ["review"])
  .addStep("performance", "performance-analysis", ["review"])
  .addStep("report", "documentation", ["security", "performance"])
  .build();
