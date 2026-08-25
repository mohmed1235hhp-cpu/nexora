# AI Core Architecture

The AI Core is a self-contained module under `src/ai-core/` that hides every
provider detail behind a single public entry point (`AIRouter`).

Request flow:
UI → AIRouter → TaskDispatcher → TaskHandler → ProviderManager → Provider
   → RetryManager → FallbackEngine → ResponsePipeline → Logger + Monitor → UI

Only `AIRouter` (and the exported types) is public. Everything else is an
internal implementation detail and can be swapped without touching the UI.
