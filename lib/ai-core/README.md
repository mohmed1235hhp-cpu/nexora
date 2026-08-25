# @workspace/ai-core

Single source of truth for all AI functionality in the workspace.

Every AI feature (chat, website generation, app generation, image
generation, voice, code review, bug fix, document analysis, and any future
AI tool) MUST go through `AIRouter.execute(...)`. UI/server code never
talks to a provider SDK directly.

## Layout

```
src/
├── index.ts            # Public API — the ONLY module external code imports
├── config/             # Runtime config (limits, providers, models, features)
├── types/              # Shared types + TaskType enum
├── router/             # AIRouter, TaskDispatcher, RouteResolver
├── engine/             # Request/Response pipeline, streaming, execution
├── providers/          # ProviderManager + Interfaces + NoopProvider stub
├── models/             # Model registry + resolver
├── tasks/              # One handler per TaskType
├── prompt/             # PromptManager, templates, versioning, validation
├── memory/             # Short/Long/Conversation memory + stores
├── context/            # Context window, history, summarizer, compressor
├── reliability/        # Retry, Fallback, CircuitBreaker, ErrorHandler
├── rate-limit/         # User/Task/Provider/Global limiters
├── cache/              # AICache, Prompt/Response/Embedding caches
├── logging/            # AILogger, MetricsCollector, TokenAccountant
├── monitoring/         # AIMonitor, LatencyTracker, QueueTracker
├── testing/            # Mocks + fixtures (excluded from build)
└── docs/               # Deep-dive architecture docs
```

## Usage from other workspace packages

```ts
import { getAIRouter, TaskType } from "@workspace/ai-core";

const res = await getAIRouter().execute({
  task: TaskType.TextChat,
  input: { message: "hello" },
  meta: { userId: "u_123" },
});
```

## Adding a real provider

1. Implement the relevant interface in `src/providers/interfaces/`
   (e.g. `ITextChatProvider`).
2. Register the instance in `ProviderManager` (or from bootstrap code).
3. No consumer changes required — the router routes by `Capability`.

## Guarantees

- No hardcoded provider values in consumer code — everything in `config/`.
- No circular imports (`types` and `config` never import upwards).
- Every interface has at least one stub implementation (`NoopProvider`).
- `AIRouter.execute()` works end-to-end (returns
  `provider-not-configured` while no real provider is registered).
