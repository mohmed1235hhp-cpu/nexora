export class AgentError extends Error {
  constructor(
    public readonly code: AgentErrorCode,
    message: string,
    public readonly agentId?: string,
    public readonly taskId?: string,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

export enum AgentErrorCode {
  NotFound = "AGENT_NOT_FOUND",
  Timeout = "AGENT_TIMEOUT",
  ExecutionFailed = "EXECUTION_FAILED",
  ValidationFailed = "VALIDATION_FAILED",
  CapabilityNotSupported = "CAPABILITY_NOT_SUPPORTED",
  QueueFull = "QUEUE_FULL",
  DependencyFailed = "DEPENDENCY_FAILED",
  CircularDependency = "CIRCULAR_DEPENDENCY",
  RetryExhausted = "RETRY_EXHAUSTED",
}
