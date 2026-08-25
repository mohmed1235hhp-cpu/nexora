# Agents Registry — Responsibilities

| # | Agent | Capability | Responsibility |
|---|-------|------------|----------------|
| 1 | RequestAgent       | request-parsing        | Parse and normalize incoming user requests |
| 2 | PlanningAgent      | planning               | Create execution plans from parsed requests |
| 3 | ResearchAgent      | research               | Research technical topics and gather context |
| 4 | ArchitectureAgent  | architecture           | Design system architecture and blueprints |
| 5 | CodingAgent        | coding                 | Generate source code from specifications |
| 6 | ReviewAgent        | review                 | Review code for quality and correctness |
| 7 | DebugAgent         | debugging              | Identify and fix bugs |
| 8 | TestingAgent       | testing                | Run and generate tests |
| 9 | DocumentationAgent | documentation          | Generate documentation and reports |
| 10| DeploymentAgent    | deployment             | Handle build and deployment |
| 11| WebsiteAgent       | website-generation     | Generate full websites |
| 12| ApplicationAgent   | application-generation | Generate full applications |
| 13| ImageAgent         | image-generation       | Generate and analyze images |
| 14| VoiceAgent         | voice-processing       | Handle voice tasks (TTS/STT) |
| 15| FileAgent          | file-handling          | Manipulate files/directories |
| 16| SecurityAgent      | security-analysis      | Analyze security posture |
| 17| PerformanceAgent   | performance-analysis   | Analyze/optimize performance |
| 18| MonitoringAgent    | monitoring             | Emit status reports |

Each agent lives in `src/agents/<name>/` with:
- `<Name>Interface.ts`  – contract + descriptor
- `<Name>Service.ts`    – domain logic wrapping AIRouter
- `<Name>Validator.ts`  – input validation
- `<Name>Executor.ts`   – the `IAgent` implementation
- `index.ts`
