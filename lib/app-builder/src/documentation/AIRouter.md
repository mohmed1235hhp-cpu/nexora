# AIRouter

Routing layer that binds every generator agent to the Lovable AI Gateway via the AI SDK.

- Default model: `openai/gpt-5.5`
- Structured output via `Output.object(zodSchema)`
- Handles NoObjectGeneratedError with graceful fallback.
