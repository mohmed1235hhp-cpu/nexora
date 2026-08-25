import type { WorkflowStep } from "../types/workflow.types";
import { AgentError, AgentErrorCode } from "../core/AgentErrors";

export class DependencyManager {
  /**
   * Returns steps grouped by dependency levels (can be parallelized within a level).
   */
  computeLevels(steps: WorkflowStep[]): WorkflowStep[][] {
    const completed = new Set<string>();
    const remaining = [...steps];
    const levels: WorkflowStep[][] = [];
    let safetyCounter = 0;
    const maxIterations = steps.length + 1;

    while (remaining.length > 0 && safetyCounter < maxIterations) {
      safetyCounter++;
      const ready = remaining.filter(s => s.dependsOn.every(d => completed.has(d)));
      if (ready.length === 0 && remaining.length > 0) {
        throw new AgentError(AgentErrorCode.CircularDependency, "Circular dependency detected in workflow");
      }
      levels.push(ready);
      for (const s of ready) {
        completed.add(s.id);
        remaining.splice(remaining.indexOf(s), 1);
      }
    }
    return levels;
  }

  validateNoCycles(steps: WorkflowStep[]): boolean {
    try {
      this.computeLevels(steps);
      return true;
    } catch {
      return false;
    }
  }
}
