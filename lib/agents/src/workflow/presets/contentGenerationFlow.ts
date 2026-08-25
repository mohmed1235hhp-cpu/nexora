import type { Workflow } from "../../types/workflow.types";
import { WorkflowBuilder } from "../WorkflowBuilder";

export const contentGenerationFlow: Workflow = new WorkflowBuilder("preset-content")
  .setName("Content Generation Pipeline")
  .addStep("plan", "planning")
  .addStep("research", "research", ["plan"])
  .addStep("write", "coding", ["research"])
  .addStep("images", "image-generation", ["write"])
  .addStep("review", "review", ["images"])
  .build();
