# Multi-Agent System — Architecture

## Overview

`@workspace/agents` is a **thin orchestration layer** built on top of `@workspace/ai-core`.
It never talks to model providers directly — every AI call passes through `AIRouter`.

```
┌────────────────────────────────────────────────────────┐
│  User request                                          │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  MasterOrchestrator (single public entry point)        │
│  ├─ AgentRegistry            (id  → IAgent)            │
│  ├─ CapabilityRegistry       (cap → agentId[])         │
│  ├─ WorkflowEngine + DependencyManager                 │
│  ├─ TaskScheduler / ExecutionController                │
│  ├─ RetrySystem (retries + fallback agents)            │
│  ├─ CommunicationHub (pub/sub — the ONLY channel)      │
│  ├─ ExecutionTimeline + TimelineEmitter                │
│  ├─ AgentMonitor / MetricsCollector / HealthCheck      │
│  ├─ SharedKnowledge + ArtifactStore                    │
│  └─ AgentLogger + LogAggregator                        │
└────────────────────────────────────────────────────────┘
                        │
       ┌────────────────┼─────────────────┐
       ▼                ▼                 ▼
   Agent A         Agent B           Agent N        (18 default agents)
       │                │                 │
       └────────────────┴─────────────────┘
                        │
                        ▼
       ┌────────────────────────────────┐
       │  @workspace/ai-core AIRouter   │  ← all model calls
       └────────────────────────────────┘
```

## Rules

1. Every agent implements `IAgent` and extends `AgentBase`.
2. Agents **never** call each other directly — always via `CommunicationHub` or `SharedKnowledge`.
3. Every model call goes through `AIRouter`.
4. Adding a new agent requires only: create the folder, implement `IAgent`, call `orchestrator.registerAgent(...)`.
5. Removing an agent requires only: `orchestrator.unregisterAgent(id)`.
