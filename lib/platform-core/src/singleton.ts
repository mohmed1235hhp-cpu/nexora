import { bootstrapPlatform, type Platform } from "./core/PlatformBootstrap";
import { registerAiCoreAgents } from "./agents/aiCoreAgents";

let _platform: Platform | null = null;

/**
 * The single, process-wide Platform instance. Boots on first use, with the
 * Phase 2 ai-core provider chains registered as agents (see aiCoreAgents.ts)
 * so `platform.ai.handle(userRequest)` is immediately a working, end-to-end
 * AI Orchestrator: intent detection -> DAG planning -> agent execution
 * (with retry + backup-agent fallback) -> merged response.
 */
export function getPlatform(): Platform {
  if (!_platform) {
    _platform = bootstrapPlatform();
    registerAiCoreAgents(_platform.agentManager);
  }
  return _platform;
}
