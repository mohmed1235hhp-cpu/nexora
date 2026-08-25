# How to extend the app-builder

1. Add a new agent in `agents/` extending `BaseAgent`.
2. Register it in `AgentRegistry`.
3. Add a matching prompt in `ai/prompts/` and schema in `ai/schemas/`.
4. Wire the agent into the appropriate pipeline stage.
