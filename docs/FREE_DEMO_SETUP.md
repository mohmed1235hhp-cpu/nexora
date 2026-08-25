# Cyber AI — Free Demo setup

The demo mode removes the need for paid Gemini/OpenRouter API keys for the
text/code agent. It uses the open-weight `Qwen/Qwen3-Coder-30B-A3B-Instruct`
model in 4-bit mode on a Hugging Face ZeroGPU Space.

## Why this model

Qwen's official model card describes Qwen3-Coder-30B-A3B-Instruct as 30.5B
total parameters with 3.3B activated experts, native 256K context, and strong
agentic coding performance. The model is Apache-2.0.

## Free limitations

Hugging Face ZeroGPU is shared infrastructure. Free accounts currently receive
5 minutes of GPU quota per day for hosted ZeroGPU Spaces; queues and limits
apply. This is therefore a demonstration/test environment, not a production
backend for 20 concurrent users.

## Deploy from a phone

1. Create a Hugging Face account and a new Space.
2. Choose **Gradio** and **ZeroGPU**.
3. Upload every file from `free-demo-space/`.
4. Wait for the Space to build and become Running.
5. Copy the Space URL, for example `https://username-cyber-ai-demo.hf.space`.
6. In the application environment set:
   - `DEMO_MODE=true`
   - `DEMO_INFERENCE_URL=https://...hf.space`
   - `DEMO_MODEL=Qwen/Qwen3-Coder-30B-A3B-Instruct`
7. Do not add `GEMINI_API_KEY` or `OPENROUTER_MEDIA_API_KEY` for demo text/code.

## What is verified locally

- Python syntax of `free-demo-space/app.py`.
- TypeScript syntax/structure of the modified provider and environment files.
- The application calls the Gradio REST/SSE endpoint `/gradio_api/call/respond`.

The remote Space itself cannot be health-checked from this source package until
it is deployed under the user's Hugging Face account.
