# @workspace/agents

Multi-Agent orchestration built on top of `@workspace/ai-core`.

- 18 default agents covering every phase (request → planning → coding → deploy)
- `MasterOrchestrator` as the single public entry point
- `WorkflowEngine` with automatic parallel/sequential execution
- `ExecutionTimeline` with icons (🧠 📋 🔍 🏗 💻 📂 🖼 🎤 🧪 🔎 🛠 📦 🚀 🌐 📄 ✅)
- `CommunicationHub`, `SharedKnowledge`, `ArtifactStore`
- `RetrySystem` with automatic retry + fallback agent
- Per-agent logging, monitoring, health checks

See `docs/ARCHITECTURE.md`, `docs/AGENTS.md`, `docs/WORKFLOW_GUIDE.md`.
