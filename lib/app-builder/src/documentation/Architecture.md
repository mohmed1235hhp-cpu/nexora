# App Builder — Architecture (Phase 1)

Clean Architecture layers:
- core/ — types, Result, errors, EventBus, Logger, DI
- app/ — Bootstrap + Config
- services/ — Agents, AgentRouter, Pipeline, Files
- features/ — app-generation, build-pipeline, preview, reports, timeline
- state/ — Zustand stores (builder/pipeline/agents/logs)
- storage/network/validation — ports + adapters
- components/screens/navigation/providers — UI

Loose coupling via EventBus. DI via Container. No external services in Phase 1.
