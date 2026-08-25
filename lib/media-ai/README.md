# @workspace/media-ai

Provider-agnostic Media AI layer for the Cyber AI workspace.

Modules: `image`, `voice`, `speech`, `ocr`, `documents`, `files`, `preview`,
`history`, `exports`, `analysis`, `compression`, `shared`.

All requests go through:
- **AI Router** — provider selection
- **Multi-Agent System** — agent specialization per media type
- **Workflow Engine** — deterministic pipeline stages (Receive → Analyze →
  Plan → Select Agent → Execute → Review → Fix → Result → Save → Report).

No provider SDK is imported directly; every capability is exposed through
an interface in `shared/interfaces` and wired through the router.
