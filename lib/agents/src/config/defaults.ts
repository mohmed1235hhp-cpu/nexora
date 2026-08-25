import type { AgentConfig, OrchestratorConfig } from "../types/config.types";

export const DEFAULT_AGENT_CONFIG: Omit<AgentConfig, "id"> = {
  enabled: true,
  maxConcurrentTasks: 3,
  defaultTimeout: 300_000,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxParallelAgents: 10,
  defaultTaskPriority: "normal",
  enableTimeline: true,
  enableMonitoring: true,
  timeoutMs: 600_000,
};
