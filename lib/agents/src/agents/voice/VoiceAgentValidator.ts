import type { AgentTask } from "../../types/task.types";

export class VoiceAgentValidator {
  validate(task: AgentTask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!task.id) errors.push("Task id is required");
    if (task.capability !== "voice-processing") {
      errors.push(`VoiceAgent only handles 'voice-processing' capability`);
    }
    if (task.input === undefined || task.input === null) {
      errors.push("Task input is required");
    }
    return { valid: errors.length === 0, errors };
  }
}
