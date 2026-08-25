/**
 * Provider Manager — real AI providers, keyed by environment variables.
 * Providers can be swapped here without touching AI Core or AI Orchestrator.
 *
 * Cyber AI uses one visible supervisor. Gemini is the main reasoning/chat engine;
 * a separate OpenRouter coding key handles website/app/code generation. Gemini owns image/video understanding and image generation;
 * OpenRouter/Qwen owns voice, speech-to-text, and media generation. Provider names are hidden from the UI.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env["GROQ_MODEL"] || "qwen/qwen3.6-27b";

const TOGETHER_URL = "https://api.together.xyz/v1/images/generations";
const TOGETHER_IMAGE_MODEL = process.env["TOGETHER_IMAGE_MODEL"] || "black-forest-labs/FLUX.1-schnell-Free";
// Editing needs an image-conditioned model; the Free/schnell endpoint doesn't support image_url input.
const TOGETHER_EDIT_MODEL = process.env["TOGETHER_EDIT_MODEL"] || "black-forest-labs/FLUX.1-kontext-pro";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = process.env["ANTHROPIC_MODEL"] || "claude-sonnet-5";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env["GEMINI_MODEL"] || "gemini-2.5-pro";
const GEMINI_IMAGE_MODEL = process.env["GEMINI_IMAGE_MODEL"] || "gemini-2.5-flash-image";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_MEDIA_KEY_ENV = "OPENROUTER_MEDIA_API_KEY";
const OPENROUTER_CODE_KEY_ENV = "OPENROUTER_CODE_API_KEY";
const OPENROUTER_MEDIA_CHAT_MODEL = process.env["OPENROUTER_QWEN_CHAT_MODEL"] || "qwen/qwen3.5-122b-a10b";
const OPENROUTER_QWEN_ASR_MODEL = process.env["OPENROUTER_QWEN_ASR_MODEL"] || "qwen/qwen3-asr-flash-2026-02-10";
const OPENROUTER_QWEN_IMAGE_MODEL = process.env["OPENROUTER_QWEN_IMAGE_MODEL"] || "qwen/qwen-image-3-pro";
const OPENROUTER_QWEN_VIDEO_MODEL = process.env["OPENROUTER_QWEN_VIDEO_MODEL"] || "alibaba/wan-2.7";
const OPENROUTER_CODE_MODEL = process.env["OPENROUTER_CODE_MODEL"] || "qwen/qwen3-coder:free";

const QWEN_BASE_URL = OPENROUTER_URL;
const QWEN_API_KEY = process.env[OPENROUTER_MEDIA_KEY_ENV] || "";
const QWEN_VISION_MODEL = process.env["OPENROUTER_QWEN_VISION_MODEL"] || OPENROUTER_MEDIA_CHAT_MODEL;
const QWEN_OMNI_MODEL = process.env["OPENROUTER_QWEN_OMNI_MODEL"] || OPENROUTER_MEDIA_CHAT_MODEL;
const QWEN_OMNI_VOICE = process.env["QWEN_OMNI_VOICE"] || "Cherry";

const DEMO_MODE = /^(1|true|yes)$/i.test(process.env["DEMO_MODE"] || "");
const DEMO_INFERENCE_URL = (process.env["DEMO_INFERENCE_URL"] || "").replace(/\/$/, "");
const DEMO_MODEL = process.env["DEMO_MODEL"] || "Qwen/Qwen3-Coder-30B-A3B-Instruct";

async function demoChat(messages: ChatMessage[]): Promise<string> {
  if (!DEMO_INFERENCE_URL) throw new Error("DEMO_INFERENCE_URL غير مضبوط. انشر free-demo-space على Hugging Face ZeroGPU ثم ضع رابط الـSpace.");
  const prompt = messages.filter(m => m.role !== "system").map(m => `${m.role}: ${m.content}`).join("\n\n");
  const context = messages.filter(m => m.role === "system").map(m => m.content).join("\n");
  const create = await fetch(`${DEMO_INFERENCE_URL}/gradio_api/call/respond`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [prompt, context] }), signal: AbortSignal.timeout(30000),
  });
  if (!create.ok) throw new Error(`Free Demo provider error [${create.status}]: ${(await create.text()).slice(0, 400)}`);
  const { event_id } = await create.json() as { event_id?: string };
  if (!event_id) throw new Error("Free Demo provider لم يعط event_id");
  const stream = await fetch(`${DEMO_INFERENCE_URL}/gradio_api/call/respond/${event_id}`, { signal: AbortSignal.timeout(300000) });
  if (!stream.ok || !stream.body) throw new Error(`Free Demo stream error [${stream.status}]`);
  const reader = stream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalText = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\n\n/);
    buffer = events.pop() || "";
    for (const event of events) {
      const line = event.split(/\r?\n/).find(l => l.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const value = Array.isArray(parsed) ? parsed[0] : parsed;
        if (typeof value === "string") finalText = value;
      } catch { /* ignore non-json heartbeat */ }
    }
  }
  if (!finalText) throw new Error("Free Demo provider أعاد استجابة فارغة");
  return finalText.trim();
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function requireKey(name: string): string {
  const key = process.env[name];
  if (!key) {
    throw new Error(
      `${name} غير مضبوط في متغيرات البيئة. أضف المفتاح في .env حتى تعمل هذه الميزة فعليًا (راجع .env.example).`,
    );
  }
  return key;
}

// ── Gemini — main chat/reasoning brain ───────────────────────────────────────
export async function geminiChat(
  messages: ChatMessage[],
  options: { json?: boolean; thinking?: boolean; temperature?: number } = {},
): Promise<string> {
  if (DEMO_MODE) return demoChat(messages);
  const apiKey = requireKey("GEMINI_API_KEY");
  const system = messages.find(m => m.role === "system")?.content;
  const contents = messages.filter(m => m.role !== "system").map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.25,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const res = await fetch(`${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Gemini API error [${res.status}]: ${bodyText.slice(0, 500)}`);
  }
  const json = await res.json() as any;
  const content = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim();
  if (!content) throw new Error("Gemini returned an empty response");
  return content;
}

// ── Gemini vision + image generation ─────────────────────────────────────────
function extractGeminiParts(json: any): Array<{ text?: string; inlineData?: { mimeType?: string; data?: string } }> {
  return json?.candidates?.[0]?.content?.parts || [];
}

export async function geminiGenerateImage(prompt: string, imageBase64?: string, mimeType = "image/png"): Promise<string> {
  const apiKey = requireKey("GEMINI_API_KEY");
  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    const data = imageBase64.includes(",") ? imageBase64.split(",", 2)[1] : imageBase64;
    parts.unshift({ inlineData: { mimeType, data } });
  }
  const res = await fetch(`${GEMINI_API_URL}/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`Gemini image API error [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  const json = await res.json() as any;
  for (const part of extractGeminiParts(json)) {
    const d = part.inlineData;
    if (d?.data) return `data:${d.mimeType || "image/png"};base64,${d.data}`;
  }
  const text = extractGeminiParts(json).map(p => p.text || "").join(" ").trim();
  throw new Error(text || "Gemini image model returned no image");
}

export async function geminiAnalyzeMedia(input: { text: string; mediaBase64: string; mimeType: string }): Promise<string> {
  const apiKey = requireKey("GEMINI_API_KEY");
  const data = input.mediaBase64.includes(",") ? input.mediaBase64.split(",", 2)[1] : input.mediaBase64;
  const res = await fetch(`${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [
      { inlineData: { mimeType: input.mimeType, data } },
      { text: input.text },
    ] }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`Gemini media API error [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  const json = await res.json() as any;
  const text = extractGeminiParts(json).map(p => p.text || "").join("").trim();
  if (!text) throw new Error("Gemini media analysis returned no text");
  return text;
}

// ── OpenRouter coding brain — isolated key for websites/apps/code ───────────
export async function codeChat(
  messages: ChatMessage[],
  options: { json?: boolean; thinking?: boolean; temperature?: number } = {},
): Promise<string> {
  const apiKey = requireKey(OPENROUTER_CODE_KEY_ENV);
  const body: Record<string, unknown> = { model: OPENROUTER_CODE_MODEL, messages, stream: false, temperature: options.temperature ?? 0.15 };
  if (options.json) body.response_format = { type: "json_object" };
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Cyber AI Code Engine" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`OpenRouter coding API error [${res.status}]: ${bodyText.slice(0, 500)}`);
  }
  const json = await res.json() as any;
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenRouter coding model returned an empty response");
  return content;
}

// ── Groq Qwen code editor/reviewer ──────────────────────────────────────────
// Used specifically for iterative code changes and second-pass fixes.
// Generation remains on OpenRouter; edits use Groq's current Qwen coding-capable model.
export async function groqCodeEdit(
  messages: ChatMessage[],
  options: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  const apiKey = requireKey("GROQ_API_KEY");
  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages,
    stream: false,
    temperature: options.temperature ?? 0.15,
    reasoning_effort: "default",
    reasoning_format: "hidden",
  };
  if (options.json) body.response_format = { type: "json_object" };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Groq Qwen code editor error [${res.status}]: ${bodyText.slice(0, 500)}`);
  }
  const json = await res.json() as any;
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq Qwen code editor returned empty content");
  return content;
}

export async function qwenImage(prompt: string, width = 1024, height = 1024): Promise<string> {
  const key = requireKey(OPENROUTER_MEDIA_KEY_ENV);
  const res = await fetch(`${OPENROUTER_URL}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Cyber AI Qwen Media" },
    body: JSON.stringify({ model: OPENROUTER_QWEN_IMAGE_MODEL, prompt, n: 1, output_format: "png" }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`OpenRouter Qwen image API error [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  const json = await res.json() as any;
  const item = json?.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:${item.media_type || "image/png"};base64,${item.b64_json}`;
  throw new Error("OpenRouter Qwen image API returned no image");
}

export async function qwenImageEdit(prompt: string, imageUrl: string): Promise<string> {
  const key = requireKey(OPENROUTER_MEDIA_KEY_ENV);
  const res = await fetch(`${OPENROUTER_URL}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Cyber AI Qwen Image Edit" },
    body: JSON.stringify({ model: OPENROUTER_QWEN_IMAGE_MODEL, prompt, input_references: [imageUrl], n: 1, output_format: "png" }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`OpenRouter Qwen image-edit API error [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  const json = await res.json() as any;
  const item = json?.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:${item.media_type || "image/png"};base64,${item.b64_json}`;
  throw new Error("OpenRouter Qwen image-edit API returned no image");
}

export async function qwenVisionChat(messages: ChatMessage[]): Promise<string> {
  const key = requireKey(OPENROUTER_MEDIA_KEY_ENV);
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Cyber AI Qwen Vision" },
    body: JSON.stringify({ model: QWEN_VISION_MODEL, messages, stream: false, temperature: 0.2 }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`OpenRouter Qwen vision API error [${res.status}]`);
  const json = await res.json() as any;
  return json?.choices?.[0]?.message?.content?.trim() || "";
}

export type QwenMediaKind = "audio" | "video" | "image";

/** Qwen multimodal chat through OpenRouter. Audio input is transcribed/understood; video input is analyzed. */
export async function qwenOmniChat(input: { text: string; mediaBase64?: string; mimeType?: string; kind?: QwenMediaKind; voice?: string; outputAudio?: boolean }): Promise<{ text: string; audioBase64?: string }> {
  const key = requireKey(OPENROUTER_MEDIA_KEY_ENV);
  const content: any[] = [{ type: "text", text: input.text }];
  if (input.mediaBase64 && input.kind === "audio") {
    const data = input.mediaBase64.includes(",") ? input.mediaBase64.split(",", 2)[1] : input.mediaBase64;
    content.unshift({ type: "input_audio", input_audio: { data, format: (input.mimeType || "audio/wav").split("/")[1] || "wav" } });
  } else if (input.mediaBase64 && input.kind === "video") {
    content.unshift({ type: "video_url", video_url: { url: input.mediaBase64 } });
  } else if (input.mediaBase64 && input.kind === "image") {
    content.unshift({ type: "image_url", image_url: { url: input.mediaBase64 } });
  }
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Cyber AI Qwen Omni" },
    body: JSON.stringify({ model: QWEN_OMNI_MODEL, messages: [{ role: "user", content }], stream: false }),
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`OpenRouter Qwen multimodal API error [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  const json = await res.json() as any;
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter Qwen multimodal returned no text");
  return { text };
}

export async function qwenSpeech(text: string, voice?: string): Promise<{ audioBase64: string; text: string }> {
  // OpenRouter's current Qwen catalog exposes ASR and multimodal text models; native Qwen audio output is not assumed here.
  // The UI can use browser TTS for the returned text, while ASR remains Qwen-based.
  const result = await qwenOmniChat({ text, voice, outputAudio: false });
  return { audioBase64: "", text: result.text };
}

export async function qwenTranscribeAudio(audioBase64: string, mimeType = "audio/wav"): Promise<string> {
  const key = requireKey(OPENROUTER_MEDIA_KEY_ENV);
  const data = audioBase64.includes(",") ? audioBase64.split(",", 2)[1] : audioBase64;
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Cyber AI Qwen ASR" },
    body: JSON.stringify({ model: OPENROUTER_QWEN_ASR_MODEL, messages: [{ role: "user", content: [
      { type: "input_audio", input_audio: { data, format: mimeType.split("/")[1] || "wav" } },
      { type: "text", text: "Transcribe this audio exactly. Preserve Arabic and English words as spoken. Return transcription only." },
    ] }] }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`OpenRouter Qwen ASR error [${res.status}]: ${(await res.text()).slice(0, 500)}`);
  const json = await res.json() as any;
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Qwen ASR returned an empty transcription");
  return text;
}

/** Wan 2.7 video generation through OpenRouter's normalized async video API. */
export async function qwenVideoGenerate(prompt: string, durationSeconds = 5): Promise<string> {
  // Hugging Face hosts open-weight text-to-video models through Inference Providers.
  // The token stays server-side; no provider key is ever sent to the browser.
  const key = requireKey("HF_TOKEN");
  const model = process.env["HF_VIDEO_MODEL"] || "Wan-AI/Wan2.2-TI2V-5B";
  const provider = process.env["HF_VIDEO_PROVIDER"] || "auto";
  const response = await fetch("https://router.huggingface.co/hf-inference/models/" + encodeURIComponent(model), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "video/mp4",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        num_frames: Math.min(Math.max(Math.round(durationSeconds * 16), 16), 96),
      },
      options: { wait_for_model: true, use_cache: false },
    }),
    signal: AbortSignal.timeout(600000),
  });
  if (!response.ok) {
    throw new Error(`Hugging Face video generation error [${response.status}]: ${(await response.text()).slice(0, 700)}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("video/")) {
    throw new Error("Hugging Face video provider returned a non-video response.");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error("Hugging Face returned an empty video.");
  // Persisting binary media requires the configured object store. Return a data URL
  // only for small/demo outputs; production deployments should set HF_VIDEO_PUBLIC_URL
  // or wire this function into the existing media storage adapter.
  const maxInline = 12 * 1024 * 1024;
  if (bytes.length > maxInline) {
    throw new Error("Generated video is larger than the inline response limit; connect the media storage adapter.");
  }
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

// ── Groq (free-tier, fast LLM inference — chat.ts, code.ts, and every text tool) ─
export async function groqChat(messages: ChatMessage[], model = GROQ_MODEL): Promise<string> {
  const apiKey = requireKey("GROQ_API_KEY");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq chat API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq chat API returned an empty response");
  return content.trim();
}

// ── Together.ai FLUX (free-tier image generation) ────────────────────────────
export async function togetherImage(
  prompt: string,
  width = 1024,
  height = 1024,
): Promise<string> {
  const apiKey = requireKey("TOGETHER_API_KEY");

  const res = await fetch(TOGETHER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TOGETHER_IMAGE_MODEL,
      prompt,
      width,
      height,
      steps: 4,
      n: 1,
      response_format: "url",
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Together image API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data?: Array<{ url?: string }> };
  const url = json.data?.[0]?.url;
  if (!url) throw new Error("Together image API returned no image URL");
  return url;
}

export async function togetherImageEdit(prompt: string, imageUrl: string): Promise<string> {
  const apiKey = requireKey("TOGETHER_API_KEY");

  const res = await fetch(TOGETHER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TOGETHER_EDIT_MODEL,
      prompt,
      image_url: imageUrl,
      width: 1024,
      height: 1024,
      steps: 28,
      n: 1,
      response_format: "url",
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // FLUX.1-kontext-pro is a paid Together model (no free tier) — surface that clearly
    // instead of silently failing, so the caller/UI can explain it to the user.
    throw new Error(`Together image-edit API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data?: Array<{ url?: string }> };
  const url = json.data?.[0]?.url;
  if (!url) throw new Error("Together image-edit API returned no image URL");
  return url;
}

// ── Anthropic Claude (website / app code generation) ─────────────────────────
export async function claudeGenerate(system: string, userPrompt: string): Promise<string> {
  const apiKey = requireKey("ANTHROPIC_API_KEY");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API error [${res.status}]: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = json.content?.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Anthropic API returned an empty response");
  return text;
}

// ── Video generation — see @workspace/ai-core Provider Manager ───────────────
// (Veo -> Runway -> Kling AI, automatic failover). videoGenerate() below is
// now a thin delegating wrapper kept for backward compatibility.

export async function videoGenerate(prompt: string, durationSeconds = 5): Promise<string> {
  return qwenVideoGenerate(prompt, durationSeconds);
}


// ── Supervisor — classifies intent then routes to the right capability ───────
// ── Unified Cyber AI agent ───────────────────────────────────────────────────
export type AssistantIntent = "chat" | "image" | "vision" | "video" | "voice" | "stt" | "website" | "app" | "code";

export interface PreviewFile { path: string; content: string; }
export interface AssistantResult {
  intent: AssistantIntent;
  content: string;
  provider: string;
  model: string;
  preview?: { id: string; url: string; files: PreviewFile[] };
  steps: string[];
}

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:html|javascript|js|jsx|tsx|css)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

/**
 * Fast supervisor: cheap deterministic routing first, Gemini only for ambiguous
 * requests. This keeps the visible agent responsive while preserving Gemini as
 * the final reasoning authority.
 */
function fastIntent(text: string, attachments: Array<{ name?: string; mimeType?: string; url?: string }> = []): AssistantIntent {
  const t = text.toLowerCase().normalize("NFKC");
  const media = attachments.map(a => (a.mimeType || "").toLowerCase());
  const hasImage = media.some(m => m.startsWith("image/"));
  const hasVideo = media.some(m => m.startsWith("video/"));
  const hasAudio = media.some(m => m.startsWith("audio/"));
  const score = (words: string[]) => words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  const explicit = (words: string[]) => score(words) > 0;

  // Media type is a high-confidence signal. Explicit generation language wins.
  if (hasImage && !explicit(["generate image", "create image", "توليد صورة", "أنشئ صورة", "اعمل صورة", "صمم صورة"])) return "vision";
  if (hasVideo && !explicit(["generate video", "create video", "توليد فيديو", "أنشئ فيديو", "اعمل فيديو", "اصنع فيديو"])) return "vision";
  if (hasAudio && explicit(["transcribe", "transcription", "speech to text", "تفريغ", "تحويل الصوت لنص", "نص من التسجيل"])) return "stt";
  if (hasAudio && !explicit(["generate", "أنشئ", "اصنع"])) return "voice";

  const intents: Array<[AssistantIntent, string[]]> = [
    ["website", ["website", "web site", "landing page", "موقع", "ويب سايت", "صفحة هبوط", "متجر إلكتروني", "موقع إلكتروني"]],
    ["app", ["mobile app", "android app", "ios app", "application", "تطبيق", "ابلكيشن", "تطبيق موبايل"]],
    ["video", ["generate video", "create video", "text to video", "توليد فيديو", "فيديو", "اعمل فيديو", "اصنع فيديو"]],
    ["image", ["generate image", "create image", "draw", "توليد صورة", "صورة", "ارسم", "اعمل صورة", "صمم صورة"]],
    ["code", ["fix code", "debug", "refactor", "typescript", "javascript", "python", "html", "css", "code", "كود", "برمج", "صلح الكود", "راجع الكود"]],
    ["voice", ["voice chat", "talk to me", "محادثة صوتية", "اتكلم معايا صوت"]],
    ["stt", ["transcribe", "transcription", "speech to text", "تحويل الصوت لنص", "تفريغ الصوت"]],
    ["vision", ["analyze image", "image analysis", "حلل الصورة", "افهم الصورة", "حلل الفيديو", "افهم الفيديو"]],
  ];

  let best: AssistantIntent = "chat";
  let bestScore = 0;
  for (const [intent, words] of intents) {
    const current = score(words);
    if (current > bestScore) { best = intent; bestScore = current; }
  }
  // Chat is the safe default and avoids an extra network call just to classify.
  return best;
}

async function classifyWithGemini(messages: ChatMessage[], attachments: Array<{ name?: string; mimeType?: string; url?: string }> = []): Promise<{ intent: AssistantIntent; needsSearch: boolean }> {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  return { intent: fastIntent(last, attachments), needsSearch: false };
}

async function searchContext(query: string): Promise<string> {
  const results = await duckDuckGoSearch(query);
  if (!results.length) return "لا توجد نتائج بحث متاحة.";
  return results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n");
}

async function generateProjectWithReview(prompt: string, kind: "website" | "app", onStep?: (step: string) => void): Promise<{ text: string; files: PreviewFile[] }> {
  onStep?.("بدء بناء المشروع عبر OpenRouter");
  const first = await codeChat([
    { role: "system", content: [
      "أنت مهندس برمجيات رئيسي. أنشئ مشروعًا صغيرًا قابلًا للمعاينة.",
      "أعد JSON فقط بالشكل: {\"files\":[{\"path\":\"index.html\",\"content\":\"...\"}],\"summary\":\"...\"}.",
      "اجعل الناتج آمنًا وقابلًا للمعاينة بدون تشغيل كود Server-side عشوائي.",
      kind === "app" ? "صمّم تجربة تطبيق ويب كاملة وقابلة للمعاينة." : "أنشئ موقعًا احترافيًا متجاوبًا.",
    ].join("\n") },
    { role: "user", content: prompt },
  ], { json: true, thinking: true, temperature: 0.12 });
  let draft: { files: PreviewFile[]; summary?: string };
  try { draft = JSON.parse(first); } catch { draft = { files: [{ path: "index.html", content: stripCodeFences(first) }] }; }
  draft.files = (draft.files || []).filter((f) => f && typeof f.path === "string" && typeof f.content === "string").slice(0, 30);
  onStep?.("مراجعة المشروع وإصلاح الأخطاء");
  const review = await codeChat([
    { role: "system", content: "راجع المشروع كمهندس QA مستقل، أصلح HTML/CSS/JS والأمان والresponsive، وأعد JSON فقط {\"files\":[...],\"review\":\"...\"}." },
    { role: "user", content: JSON.stringify({ files: draft.files }) },
  ], { json: true, thinking: true, temperature: 0.03 });
  try {
    const fixed = JSON.parse(review) as { files?: PreviewFile[]; review?: string };
    const files = (fixed.files || draft.files).filter((f) => f && typeof f.path === "string" && typeof f.content === "string");
    return { text: fixed.review || "تم إنشاء المشروع ومراجعته وإصلاح الأخطاء المكتشفة.", files };
  } catch { return { text: "تم إنشاء المشروع والاحتفاظ بالمسودة بعد تعذر تحليل نتيجة المراجعة.", files: draft.files }; }
}

export async function runAssistant(
  messages: ChatMessage[],
  createPreview?: (files: PreviewFile[]) => { id: string; url: string },
  attachments: Array<{ name?: string; mimeType?: string; size?: number; url?: string }> = [],
  onStep?: (step: string) => void,
): Promise<AssistantResult> {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const { intent, needsSearch } = await classifyWithGemini(messages, attachments);
  const steps: string[] = ["Supervisor: تحليل سريع واختيار الأداة المناسبة"];
  let workingMessages = [...messages];

  if (needsSearch) {
    const context = await searchContext(last);
    workingMessages = [{ role: "system", content: "استخدم نتائج البحث كمرجع ولا تخترع مصادر." }, ...messages, { role: "system", content: `نتائج البحث الحالية:\n${context}` }];
    steps.push("جمع سياق حديث");
  }

  // Media attached to the single-agent page is routed directly to Gemini vision.
  const imageAttachment = attachments.find(a => (a.mimeType || "").startsWith("image/") && a.url);
  const videoAttachment = attachments.find(a => (a.mimeType || "").startsWith("video/") && a.url);
  const audioAttachment = attachments.find(a => (a.mimeType || "").startsWith("audio/") && a.url);

  if (intent === "website" || intent === "app") {
    steps.push("OpenRouter/Qwen: بناء المشروع");
    onStep?.("المشروع قيد التنفيذ الآن — لا تغلق الصفحة");
    const project = await generateProjectWithReview(last, intent, onStep);
    steps.push("QA: مراجعة وإصلاح تلقائي");
    onStep?.("تجهيز المعاينة الحقيقية للمشروع");
    const preview = createPreview ? createPreview(project.files) : undefined;
    if (preview) steps.push("تجهيز Preview آمن");
    return { intent, provider: "openrouter", model: OPENROUTER_CODE_MODEL, content: project.text, preview: preview ? { ...preview, files: project.files } : undefined, steps };
  }

  if (intent === "code") {
    steps.push("OpenRouter/Qwen: تنفيذ الكود");
    const draft = await codeChat([{ role: "system", content: "أنت مهندس برمجيات خبير. أعطِ حلاً كاملاً وآمنًا وقابلًا للتنفيذ." }, ...workingMessages], { thinking: true, temperature: 0.08 });
    const fixed = await codeChat([{ role: "system", content: "راجع الكود كـQA مستقل. أصلح syntax والمنطق والأمان والتوافق، وأعد النسخة النهائية فقط." }, { role: "user", content: draft }], { thinking: true, temperature: 0.03 });
    steps.push("QA: مراجعة وإصلاح");
    return { intent, provider: "openrouter", model: OPENROUTER_CODE_MODEL, content: fixed, steps };
  }

  if (intent === "image") {
    steps.push("Gemini Image: توليد الصورة");
    return { intent, provider: "gemini", model: GEMINI_IMAGE_MODEL, content: await geminiGenerateImage(last), steps };
  }

  if (intent === "video") {
    onStep?.("الفيديو قيد التوليد الآن — العملية حقيقية وقد تستغرق وقتًا");
    steps.push("Video generation: بدء التوليد");
    const video = await qwenVideoGenerate(last, 5);
    onStep?.("اكتمل توليد الفيديو");
    return { intent, provider: "openrouter", model: OPENROUTER_QWEN_VIDEO_MODEL, content: video, steps };
  }

  if (intent === "vision") {
    const media = imageAttachment || videoAttachment;
    if (!media?.url) return { intent, provider: "gemini", model: GEMINI_MODEL, content: "أرسل الصورة أو الفيديو مع طلبك لأحلله مباشرة.", steps };
    steps.push(`Gemini Vision: تحليل ${imageAttachment ? "الصورة" : "الفيديو"}`);
    const url = media.url;
    const isDataUrl = /^data:/i.test(url);
    if (!isDataUrl) return { intent, provider: "gemini", model: GEMINI_MODEL, content: "الرابط المرفق يجب أن يكون ملفًا متاحًا للـBackend أو Data URL حتى أرسله إلى Gemini بأمان.", steps };
    const match = url.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) return { intent, provider: "gemini", model: GEMINI_MODEL, content: "تعذر قراءة الملف المرفق.", steps };
    const content = await geminiAnalyzeMedia({ text: last || "حلل هذا الملف بالتفصيل وأعطني أهم النتائج.", mediaBase64: match[2], mimeType: match[1] });
    return { intent, provider: "gemini", model: GEMINI_MODEL, content, steps };
  }

  if (intent === "stt") {
    if (!audioAttachment?.url) return { intent, provider: "openrouter", model: OPENROUTER_QWEN_ASR_MODEL, content: "أرسل التسجيل الصوتي مع طلبك لتحويله إلى نص.", steps };
    const match = audioAttachment.url.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) return { intent, provider: "openrouter", model: OPENROUTER_QWEN_ASR_MODEL, content: "تعذر قراءة التسجيل الصوتي.", steps };
    steps.push("OpenRouter/Qwen ASR: تحويل الصوت إلى نص");
    const content = await qwenTranscribeAudio(match[2], match[1]);
    return { intent, provider: "openrouter", model: OPENROUTER_QWEN_ASR_MODEL, content, steps };
  }

  if (intent === "voice") {
    steps.push("OpenRouter/Qwen: معالجة المحادثة الصوتية");
    if (audioAttachment?.url) {
      const match = audioAttachment.url.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        const transcript = await qwenTranscribeAudio(match[2], match[1]);
        const reply = await geminiChat([...messages, { role: "user", content: `نص الرسالة الصوتية: ${transcript}` }], { thinking: true, temperature: 0.22 });
        return { intent, provider: "gemini", model: GEMINI_MODEL, content: reply, steps: [...steps, "Gemini: صياغة الرد"] };
      }
    }
    const reply = await geminiChat(workingMessages, { thinking: true, temperature: 0.22 });
    return { intent, provider: "gemini", model: GEMINI_MODEL, content: reply, steps: [...steps, "Gemini: صياغة الرد"] };
  }

  steps.push("Gemini: التفكير والإجابة");
  const reply = await geminiChat(workingMessages, { thinking: true, temperature: 0.22 });
  return { intent: "chat", provider: "gemini", model: GEMINI_MODEL, content: reply, steps };
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string | null,
): Promise<{ translatedText: string; detectedLang: string | null }> {
  const langPair = sourceLang ? `${sourceLang}|${targetLang}` : `auto|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`MyMemory API error: ${res.status}`);

  const json = await res.json() as any;
  const translated = json?.responseData?.translatedText ?? text;
  const detected = json?.responseData?.detectedLanguage ?? null;

  return { translatedText: translated, detectedLang: detected };
}

// ── DuckDuckGo Search (free, no key needed) ──────────────────────────────────
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function duckDuckGoSearch(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&skip_disambig=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const json = await res.json() as any;
  const results: SearchResult[] = [];

  if (json.AbstractURL && json.AbstractText) {
    results.push({
      title: json.AbstractSource || "Wikipedia",
      url: json.AbstractURL,
      snippet: json.AbstractText.substring(0, 300),
    });
  }

  if (Array.isArray(json.RelatedTopics)) {
    for (const topic of json.RelatedTopics.slice(0, 5)) {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.substring(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text.substring(0, 200),
        });
      }
    }
  }

  return results.slice(0, 8);
}

// ── Provider registry (for /providers endpoint) ──────────────────────────────
export const PROVIDERS = [
  {
    id: "groq",
    name: "Groq",
    description: "استدلال سريع ومجاني (بحدود استخدام) لنماذج Llama/GPT-OSS المفتوحة — يشغّل المحادثة وكل الأدوات النصية",
    isFree: true,
    isOpenSource: false,
    website: "https://console.groq.com",
    tools: ["chat", "voice", "code", "document", "presentation", "content", "email",
      "data", "summarize", "analyze-image", "ocr", "study", "security"],
  },
  {
    id: "together",
    name: "Together.ai (FLUX.1)",
    description: "توليد صور حقيقي عبر نموذج FLUX.1 مفتوح المصدر — التوليد الأساسي مجاني، التعديل (Kontext) مدفوع",
    isFree: true,
    isOpenSource: true,
    website: "https://together.ai",
    tools: ["image"],
  },
  {
    id: "together-paid",
    name: "Together.ai (FLUX.1 Kontext)",
    description: "تعديل الصور بالذكاء الاصطناعي — يتطلب رصيد مدفوع على Together.ai (بدون تجربة مجانية لهذا النموذج تحديداً)",
    isFree: false,
    isOpenSource: true,
    website: "https://together.ai",
    tools: ["image-edit"],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "توليد كود مواقع وتطبيقات كاملة بجودة عالية — يتطلب مفتاح API مدفوع من Anthropic",
    isFree: false,
    isOpenSource: false,
    website: "https://console.anthropic.com",
    tools: ["website", "app"],
  },
  {
    id: "mymemory",
    name: "MyMemory Translation",
    description: "Free translation API supporting 100+ languages",
    isFree: true,
    isOpenSource: false,
    website: "https://mymemory.translated.net",
    tools: ["translate"],
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo Search",
    description: "Free search engine with instant answers API",
    isFree: true,
    isOpenSource: false,
    website: "https://duckduckgo.com",
    tools: ["search"],
  },
  {
    id: "video-providers",
    name: "Veo / Runway / Kling AI",
    description: "توليد فيديو حقيقي — سلسلة مزودين مع تبديل تلقائي عند الفشل (Veo ثم Runway ثم Kling AI)",
    isFree: false,
    isOpenSource: false,
    website: "https://ai.google.dev",
    tools: ["video"],
  },
];

// ── AI Tools catalogue ───────────────────────────────────────────────────────
export const AI_TOOLS = [
  { name: "chat", label: "Text Chat", labelAr: "محادثة كتابية", creditsPerUse: 5, providerId: "groq", category: "محادثة", icon: "MessageSquare" },
  { name: "voice", label: "Voice Chat", labelAr: "محادثة صوتية", creditsPerUse: 5, providerId: "groq", category: "محادثة", icon: "Mic" },
  { name: "image", label: "Image Generation", labelAr: "إنشاء الصور", creditsPerUse: 10, providerId: "together", category: "صور", icon: "Image" },
  { name: "image-edit", label: "Image Editing", labelAr: "تعديل الصور", creditsPerUse: 10, providerId: "together-paid", category: "صور", icon: "PenTool" },
  { name: "translate", label: "Translation", labelAr: "الترجمة", creditsPerUse: 2, providerId: "mymemory", category: "لغة", icon: "Languages" },
  { name: "code", label: "Code Generation", labelAr: "إنشاء الأكواد", creditsPerUse: 7, providerId: "groq", category: "تطوير", icon: "Code2" },
  { name: "document", label: "Document Generation", labelAr: "إنشاء المستندات", creditsPerUse: 8, providerId: "groq", category: "كتابة", icon: "FileText" },
  { name: "presentation", label: "Presentations", labelAr: "العروض التقديمية", creditsPerUse: 8, providerId: "groq", category: "كتابة", icon: "Presentation" },
  { name: "content", label: "Content Writing", labelAr: "كتابة المحتوى", creditsPerUse: 7, providerId: "groq", category: "كتابة", icon: "PenLine" },
  { name: "email", label: "Email Writing", labelAr: "كتابة الإيميلات", creditsPerUse: 5, providerId: "groq", category: "كتابة", icon: "Mail" },
  { name: "data", label: "Data Analysis", labelAr: "تحليل البيانات", creditsPerUse: 8, providerId: "groq", category: "تحليل", icon: "BarChart2" },
  { name: "search", label: "Smart Search", labelAr: "البحث الذكي", creditsPerUse: 3, providerId: "duckduckgo", category: "بحث", icon: "Search" },
  { name: "summarize", label: "Summarize", labelAr: "تلخيص الملفات", creditsPerUse: 4, providerId: "groq", category: "تحليل", icon: "AlignLeft" },
  { name: "analyze-image", label: "Image Analysis", labelAr: "تحليل الصور", creditsPerUse: 8, providerId: "groq", category: "صور", icon: "ScanSearch" },
  { name: "ocr", label: "OCR", labelAr: "استخراج النصوص", creditsPerUse: 3, providerId: "groq", category: "صور", icon: "ScanText" },
  { name: "website", label: "Website Generator", labelAr: "إنشاء المواقع", creditsPerUse: 15, providerId: "anthropic", category: "تطوير", icon: "Globe" },
  { name: "app", label: "App Generator", labelAr: "إنشاء التطبيقات", creditsPerUse: 15, providerId: "anthropic", category: "تطوير", icon: "AppWindow" },
  { name: "study", label: "Study Assistant", labelAr: "مساعد الدراسة", creditsPerUse: 5, providerId: "groq", category: "تعليم", icon: "GraduationCap" },
  { name: "security", label: "Cybersecurity Assistant", labelAr: "مساعد الأمن السيبراني", creditsPerUse: 6, providerId: "groq", category: "أمن", icon: "Shield" },
  { name: "video", label: "Video Generation", labelAr: "إنشاء الفيديو", creditsPerUse: 20, providerId: "replicate", category: "فيديو", icon: "Video" },
];
