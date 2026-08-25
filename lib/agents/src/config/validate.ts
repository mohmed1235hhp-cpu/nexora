import type { AgentConfig } from "../types/config.types";

export function validateAgentConfig(config: Partial<AgentConfig>): string[] {
  const errors: string[] = [];
  if (config.maxConcurrentTasks !== undefined && config.maxConcurrentTasks < 1) {
    errors.push("maxConcurrentTasks must be >= 1");
  }
  if (config.retryAttempts !== undefined && config.retryAttempts < 0) {
    errors.push("retryAttempts must be >= 0");
  }
  if (config.defaultTimeout !== undefined && config.defaultTimeout < 100) {
    errors.push("defaultTimeout must be >= 100ms");
  }
  return errors;
}
