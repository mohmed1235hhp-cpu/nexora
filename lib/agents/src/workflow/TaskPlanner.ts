import type { Workflow } from "../types/workflow.types";
import { WorkflowBuilder } from "./WorkflowBuilder";

export class TaskPlanner {
  /**
   * Analyzes a user request and creates an appropriate workflow.
   * This is a simplified heuristic planner — in production, use AI router to decide.
   */
  planFromRequest(request: string): Workflow {
    const lower = request.toLowerCase();
    if (lower.includes("website") || lower.includes("landing page")) {
      return this.getWebsiteWorkflow();
    }
    if (lower.includes("app") || lower.includes("application")) {
      return this.getApplicationWorkflow();
    }
    if (lower.includes("review") || lower.includes("analyze code")) {
      return this.getCodeReviewWorkflow();
    }
    // Default: full development flow
    return this.getFullDevelopmentWorkflow();
  }

  getFullDevelopmentWorkflow(): Workflow {
    return new WorkflowBuilder("full-dev")
      .setName("Full Development Flow")
      .addStep("parse", "request-parsing")
      .addStep("plan", "planning", ["parse"])
      .addStep("research", "research", ["plan"])
      .addStep("arch", "architecture", ["research"])
      .addStep("code", "coding", ["arch"])
      .addStep("review", "review", ["code"])
      .addStep("debug", "debugging", ["review"])
      .addStep("test", "testing", ["debug"])
      .addStep("docs", "documentation", ["test"])
      .addStep("deploy", "deployment", ["docs"])
      .build();
  }

  getWebsiteWorkflow(): Workflow {
    return new WorkflowBuilder("website")
      .setName("Website Generation")
      .addStep("plan", "planning")
      .addStep("design", "architecture", ["plan"])
      .addStep("generate", "website-generation", ["design"])
      .addStep("review", "review", ["generate"])
      .addStep("deploy", "deployment", ["review"])
      .build();
  }

  getApplicationWorkflow(): Workflow {
    return new WorkflowBuilder("app")
      .setName("Application Generation")
      .addStep("plan", "planning")
      .addStep("arch", "architecture", ["plan"])
      .addStep("generate", "application-generation", ["arch"])
      .addStep("test", "testing", ["generate"])
      .addStep("deploy", "deployment", ["test"])
      .build();
  }

  getCodeReviewWorkflow(): Workflow {
    return new WorkflowBuilder("code-review")
      .setName("Code Review Flow")
      .addStep("review", "review")
      .addStep("security", "security-analysis", ["review"])
      .addStep("perf", "performance-analysis", ["review"])
      .addStep("report", "documentation", ["security", "perf"])
      .build();
  }
}
