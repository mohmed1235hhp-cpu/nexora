/**
 * @workspace/platform-core — Phase 1 public API.
 * Consumers MUST only import from this module.
 */
export * from "./types";
export { AICore } from "./core/AICore";
export { HeuristicIntentAnalyzer, type IIntentAnalyzer } from "./core/IntentAnalyzer";
export { ResultMerger } from "./core/ResultMerger";
export { bootstrapPlatform, type Platform, type BootstrapOverrides } from "./core/PlatformBootstrap";

export { TaskManager, INTENT_BLUEPRINTS } from "./tasks/TaskManager";
export { AIOrchestrator } from "./orchestrator/AIOrchestrator";
export { AgentManager, type IAgentAdapter, type AgentDescriptor, type AgentStatus } from "./agents/AgentManager";
export { adaptLegacyAgent, type LegacyAgent, type LegacyAgentAdapterOptions } from "./agents/AgentAdapter";
export { MemoryManager, InMemoryStore, type IMemoryStore, type ConversationTurn } from "./memory/MemoryManager";
export {
  SearchManager,
  defaultSearchConfig,
  type ISearchProvider,
  type SearchQuery,
  type SearchHit,
  type SearchManagerConfig,
} from "./search/SearchManager";
export { PlatformMonitor, type DashboardSnapshot, type AgentMetrics } from "./monitoring/PlatformMonitor";
export {
  PlatformLogger,
  ScopedLogger,
  ConsoleSink,
  MemorySink,
  type ILogSink,
  type LogRecord,
  type LogLevel,
} from "./logging/PlatformLogger";
export { AgentSandbox, SandboxManager, type SandboxTool } from "./sandbox/AgentSandbox";
export { PermissionSystem, PermissionError, type Permission, type Principal } from "./security/PermissionSystem";
export { RateLimiter, type RateLimitConfig } from "./security/RateLimiter";
export { validateUserRequest, sanitizeOutput, userRequestSchema } from "./security/InputValidator";
export { CircuitBreaker, type CircuitState, type CircuitConfig } from "./reliability/CircuitBreaker";
export { withRetry, defaultRetry, type RetryConfig } from "./reliability/RetryPolicy";
export { runWithFallback, type FallbackStep, type FallbackResult } from "./reliability/FallbackSystem";
export { getPlatform } from "./singleton";
export { registerAiCoreAgents, AI_CORE_AGENT_CAPABILITIES } from "./agents/aiCoreAgents";
