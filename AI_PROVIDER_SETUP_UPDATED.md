# AI provider update

This update keeps the existing NEXORA-AI architecture and changes only the provider routing.

- Website/app generation: OpenRouter with `qwen/qwen3-coder:free`.
- Website/app code edits and second-pass review: Groq with `qwen/qwen3.6-27b`.
- Website/app responses now include a server-side preview URL backed by the existing `/api/ai/preview/:id` store.
- Video generation: Hugging Face server-side inference using `Wan-AI/Wan2.2-TI2V-5B`.
- No API secret is embedded in frontend code or source control.

Important: Hugging Face inference availability and free quota depend on the selected Inference Provider/account. The code does not falsely promise unlimited free video generation.
