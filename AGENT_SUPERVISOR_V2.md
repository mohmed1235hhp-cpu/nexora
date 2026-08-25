# NEXORA — Unified Supervisor V2

The main visible agent is a single supervisor. It performs a fast local intent pass first and only asks Gemini to classify ambiguous requests. It routes:

- Gemini: chat/reasoning, image generation, image/video understanding (media endpoints)
- OpenRouter/Qwen: voice, speech-to-text, media generation
- OpenRouter coding key: websites, apps, code generation/review/fix

No API keys are stored in the repository.
