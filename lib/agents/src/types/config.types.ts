export interface AgentConfig {
  id: string;
  enabled: boolean;
  maxConcurrentTasks: number;
  defaultTimeout: number;
  retryAttempts: number;
  retryDelayMs: number;
  fallbackAgentId?: string;
  customSettings?: Record<string, unknown>;
}

export interface OrchestratorConfig {
  maxParallelAgents: number;
  defaultTaskPriority: "low" | "normal" | "high";
  enableTimeline: boolean;
  enableMonitoring: boolean;
  timeoutMs: number;
}
