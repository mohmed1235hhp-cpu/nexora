# Phase 1 — AI Platform Core Architecture

## Layered View

```
┌─────────────────────────────────────────────────────────────────┐
│                             USER                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AI  CORE                               │
│  Validate → Permissions → RateLimit → Memory.appendUserTurn     │
│  → IntentAnalyzer → TaskManager → AIOrchestrator                │
│  → ResultMerger → Memory.appendAssistantTurn → Response         │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       TASK  MANAGER                             │
│  INTENT_BLUEPRINTS → Task[] → parallelGroups (Kahn layers)      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI  ORCHESTRATOR                            │
│  discover → CircuitBreaker → retry → fallback(backup)           │
│  → graceful degrade → PlatformMonitor.mark*                     │
└──┬─────────────────┬────────────────┬─────────────────┬─────────┘
   ▼                 ▼                ▼                 ▼
┌───────┐        ┌───────┐        ┌───────┐         ┌───────┐
│Agent 1│        │Agent 2│  …     │Agent N│         │Backup │
│ +sbx  │        │ +sbx  │        │ +sbx  │         │  sbx  │
└───────┘        └───────┘        └───────┘         └───────┘

Cross-cutting: Memory | Search | Monitor | Logger | Permissions | RateLimit
```

## Rules

1. **No agent-to-agent direct calls.** Everything routes through `AIOrchestrator`.
2. **AI Core never invokes agents.** It talks to the Orchestrator only.
3. **Each agent runs in its own `AgentSandbox`** (memory/cache/tools/logs isolated).
4. **Add an agent = one call**: `agentManager.register(adaptLegacyAgent(legacy))`.
5. **Fail-safe by default**: retry once, fallback to backup, then graceful degrade.
6. **Zero-trust I/O**: Zod validation on input, sanitization on output.

## Scalability

10 → 100 agents requires no architectural change:
- `AgentManager` uses a `Map<id, entry>` (O(1) lookup).
- `discover(capability)` filters loaded agents.
- Parallel task layers scale with `Promise.all` fan-out.
- The Orchestrator is stateless per request; memory lives in `MemoryManager`.
