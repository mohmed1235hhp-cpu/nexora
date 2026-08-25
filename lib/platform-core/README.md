# @workspace/platform-core — Phase 1 AI Platform Core

Top-level façade over `@workspace/ai-core` and `@workspace/agents`.
Implements the Phase 1 spec: a single AI Core that receives every user request,
plans it, dispatches tasks through the AI Orchestrator to isolated agents, and
merges results back into one professional response.

## Request Flow

```
User
 └─► AICore.handle(request)
      ├─ InputValidator (Zod) + PermissionSystem + RateLimiter
      ├─ MemoryManager.appendTurn(user)
      ├─ IIntentAnalyzer.analyze()                    → IntentAnalysis
      ├─ TaskManager.plan()                           → ExecutionPlan (DAG + parallel layers)
      ├─ AIOrchestrator.execute(plan)
      │   ├─ AgentManager.discover(capability)        → IAgentAdapter[]
      │   ├─ CircuitBreaker.canPass(agent)
      │   ├─ withRetry(agent.execute)                 (retry once)
      │   ├─ fallback → backup agent
      │   ├─ fallback → graceful degraded output
      │   ├─ SandboxManager.getOrCreate(agent)        (isolated mem/cache/logs/tools)
      │   └─ PlatformMonitor.mark*                    (metrics)
      ├─ ResultMerger.merge()                         → PlatformResponse
      └─ MemoryManager.appendTurn(assistant)
```

## What's in the box

| Module                       | Role                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `AICore`                     | Brain. Only public entry point for user requests.                    |
| `IntentAnalyzer`             | Understands intent + complexity (heuristic; swap for LLM-backed).    |
| `TaskManager`                | Splits request into DAG of Tasks + parallel groups.                  |
| `AIOrchestrator`             | Only entity allowed to invoke agents. Handles retry/fallback/CB.     |
| `AgentManager`               | Register / discover / load / unload / health check agents.           |
| `SandboxManager`             | Per-agent-per-session sandbox: memory, cache, tools, logs.           |
| `MemoryManager`              | Conversation / session / project / long-term / temp / context.      |
| `SearchManager`              | Internet search + trusted-source scoring + citation + cache.        |
| `PlatformMonitor`            | Metrics + dashboard snapshot (agents, avg RT, queue, errors).       |
| `PlatformLogger`             | Structured logs, multi-sink (console + in-memory buffer).           |
| `PermissionSystem`           | Zero-trust scope checks on every request.                            |
| `RateLimiter`                | Token bucket per principal.                                          |
| `CircuitBreaker`             | Per-agent breaker (closed/open/half-open).                           |
| `withRetry`                  | Exponential backoff + jitter.                                        |
| `runWithFallback`            | Primary → backup → graceful chain.                                   |
| `adaptLegacyAgent`           | Wrap existing `@workspace/agents` IAgent into IAgentAdapter.         |

## Guarantees (Phase 1)

- **No feature broken.** Existing packages are untouched; this package sits on top.
- **Backward compatible.** Legacy agents plug in via `adaptLegacyAgent`.
- **Agents never talk to each other.** All routing goes through `AIOrchestrator`.
- **AI Core never calls agents.** Only `AIOrchestrator` does.
- **Zero-trust.** Every request is validated + permission-checked + rate-limited.
- **Fault tolerant.** Retry → backup → graceful degrade. Never crashes.
- **Observable.** Every step is logged and metered.
- **Scalable.** Adding a 100th agent = one `agentManager.register(...)` call.

## Usage

```ts
import {
  bootstrapPlatform,
  adaptLegacyAgent,
} from "@workspace/platform-core";
import { registerDefaultAgents } from "@workspace/agents";

const platform = bootstrapPlatform();

// Register all your existing agents:
for (const legacy of listYourAgents()) {
  platform.agentManager.register(adaptLegacyAgent(legacy, { backupAgentId: "chat-agent" }));
}

// Handle a user request:
const response = await platform.ai.handle({
  requestId: crypto.randomUUID(),
  sessionId: "user-42",
  userId: "user-42",
  input: "Build me a landing page for a coffee shop",
});

console.log(response.text);
console.log(platform.monitor.renderText());
```

## Testing

```bash
pnpm --filter @workspace/platform-core test
```
