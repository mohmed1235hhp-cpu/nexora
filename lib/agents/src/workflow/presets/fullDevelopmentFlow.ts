import type { Workflow } from "../../types/workflow.types";
import { WorkflowBuilder } from "../WorkflowBuilder";

export const fullDevelopmentFlow: Workflow = new WorkflowBuilder("preset-full-dev")
  .setName("Full Development Pipeline")
  .setDescription("Complete flow from request to deployment")
  .addStep("request", "request-parsing")
  .addStep("plan", "planning", ["request"])
  .addStep("research", "research", ["plan"])
  .addStep("architecture", "architecture", ["research"])
  .addStep("coding", "coding", ["architecture"])
  .addStep("files", "file-handling", ["coding"])
  .addStep("images", "image-generation", ["coding"])
  .addStep("tests", "testing", ["files"])
  .addStep("review", "review", ["tests"])
  .addStep("debug", "debugging", ["review"])
  .addStep("build", "deployment", ["debug"])
  .addStep("docs", "documentation", ["build"])
  .build();
