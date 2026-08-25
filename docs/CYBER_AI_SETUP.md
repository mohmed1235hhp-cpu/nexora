# Cyber AI — unified AI agent

This update changes only the AI surface and AI provider logic. Profile, account, community, messages, billing and other product pages are not modified.

## Architecture

- One visible agent: `Cyber AI`.
- Gemini is the main reasoning/chat model. A separate OpenRouter key powers website/app/code generation.
- Requests are classified internally; the user never switches modes.
- Search is invoked internally when the request needs fresh information.
- Code tasks run a two-pass flow: generate -> independent review/fix.
- Website/app tasks run: generate -> review/fix -> static Preview link.
- Normal chat never creates a Preview link.
- The final answer is streamed to the browser in small chunks.
- Qwen is wired for image generation/editing, multimodal audio/video conversation, speech output, and Wan video generation through Model Studio.

## Environment

Required for the main agent:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-pro
OPENROUTER_CODE_MODEL=anthropic/claude-sonnet-5
OPENROUTER_CODE_API_KEY=
```

For Qwen Image:

```env
OPENROUTER_MEDIA_API_KEY=
QWEN_IMAGE_MODEL=qwen-image-2.0-pro
OPENROUTER_QWEN_IMAGE_MODEL=qwen/qwen-image-3-pro
```

For a public preview URL, set:

```env
PUBLIC_BASE_URL=https://your-domain.example
```

## Preview safety

The demo Preview endpoint serves generated static HTML/CSS/JS and does not execute Node, Python, shell commands, package installs, or server-side project code. Production deployments that need full-stack previews should replace the in-memory store with a sandboxed isolated runner.

# Qwen multimodal / voice / video
OPENROUTER_QWEN_OMNI_MODEL=qwen/qwen3.5-122b-a10b
OPENROUTER_QWEN_CHAT_MODEL=qwen/qwen3.5-122b-a10b
QWEN_OMNI_VOICE=Cherry
QWEN_VIDEO_MODEL=wan2.7-t2v-2026-06-12
OPENROUTER_QWEN_VIDEO_MODEL=alibaba/wan-2.7
OPENROUTER_QWEN_ASR_MODEL=qwen/qwen3-asr-flash-2026-02-10
