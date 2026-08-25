/**
 * PlatformBootstrap — dependency-injection composition root for Phase 1.
 * Wires every manager together with sensible defaults.
 * Users can pass overrides for any dep (interface-based) to swap implementations.
 */
import { PlatformLogger, ConsoleSink, MemorySink } from "../logging/PlatformLogger";
import { PermissionSystem } from "../security/PermissionSystem";
import { RateLimiter } from "../security/RateLimiter";
import { MemoryManager } from "../memory/MemoryManager";
import { SearchManager, type ISearchProvider } from "../search/SearchManager";
import { PlatformMonitor } from "../monitoring/PlatformMonitor";
import { SandboxManager } from "../sandbox/AgentSandbox";
import { AgentManager } from "../agents/AgentManager";
import { TaskManager } from "../tasks/TaskManager";
import { AIOrchestrator } from "../orchestrator/AIOrchestrator";
import { HeuristicIntentAnalyzer, type IIntentAnalyzer } from "./IntentAnalyzer";
import { ResultMerger } from "./ResultMerger";
import { AICore } from "./AICore";

export interface BootstrapOverrides {
  readonly intentAnalyzer?: IIntentAnalyzer;
  readonly searchProviders?: readonly ISearchProvider[];
}

export interface Platform {
  readonly ai: AICore;
  readonly agentManager: AgentManager;
  readonly memory: MemoryManager;
  readonly search: SearchManager;
  readonly monitor: PlatformMonitor;
  readonly logger: PlatformLogger;
  readonly logSink: MemorySink;
  readonly sandboxes: SandboxManager;
}

export function bootstrapPlatform(overrides: BootstrapOverrides = {}): Platform {
  const memorySink = new MemorySink();
  const logger = new PlatformLogger([new ConsoleSink(), memorySink]);
  const permissions = new PermissionSystem();
  const rateLimiter = new RateLimiter();
  const memory = new MemoryManager();
  const search = new SearchManager(overrides.searchProviders ?? []);
  const monitor = new PlatformMonitor();
  const sandboxes = new SandboxManager((scope) => logger.child(scope));
  const agentManager = new AgentManager();
  const taskManager = new TaskManager();
  const orchestrator = new AIOrchestrator({
    agentManager,
    sandboxes,
    monitor,
    logger: logger.child("orchestrator"),
  });
  const intentAnalyzer = overrides.intentAnalyzer ?? new HeuristicIntentAnalyzer();
  const merger = new ResultMerger();
  const ai = new AICore({
    taskManager,
    orchestrator,
    agentManager,
    memory,
    search,
    monitor,
    logger: logger.child("ai-core"),
    permissions,
    rateLimiter,
    intentAnalyzer,
    merger,
  });

  return { ai, agentManager, memory, search, monitor, logger, logSink: memorySink, sandboxes };
}
