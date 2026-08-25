import type { AgentTask } from "../../types/task.types";

export class ApplicationAgentValidator {
  validate(task: AgentTask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!task.id) errors.push("Task id is required");
    if (task.capability !== "application-generation") {
      errors.push(`ApplicationAgent only handles 'application-generation' capability`);
    }
    if (task.input === undefined || task.input === null) {
      errors.push("Task input is required");
    }
    return { valid: errors.length === 0, errors };
  }
}
