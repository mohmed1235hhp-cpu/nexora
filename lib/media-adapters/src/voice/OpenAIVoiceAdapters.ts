import type {
  AdapterContext,
  IMediaAdapter,
  STTInput,
  STTOutput,
  TTSInput,
  TTSOutput,
} from "@workspace/media-core";

export class OpenAITTSAdapter implements IMediaAdapter<TTSInput, TTSOutput> {
  readonly meta = {
    id: "openai-gpt-4o-mini-tts",
    provider: "openai" as const,
    kind: "voice-tts" as const,
    qualityTier: "flagship" as const,
    capabilities: ["mp3", "wav", "ogg", "ssml-lite"],
  };

  constructor(private readonly apiKey: string = process.env["OPENAI_API_KEY"] ?? "") {}

  async execute(input: TTSInput, ctx: AdapterContext): Promise<TTSOutput> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY missing");
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      signal: ctx.signal,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: input.text,
        voice: input.voice,
        response_format: input.format,
        speed: input.speed,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI TTS error [${res.status}]: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    ctx.onProgress?.(1);
    return {
      provider: "openai",
      format: input.format,
      audioUrl: `data:audio/${input.format};base64,${buf.toString("base64")}`,
    };
  }

  async estimateCost(input: TTSInput) {
    // ~$15 / 1M chars
    return { currency: "USD" as const, estimated: (input.text.length / 1_000_000) * 15 };
  }

  async healthCheck() {
    return { ok: Boolean(this.apiKey), latencyMs: 0 };
  }
}

export class OpenAISTTAdapter implements IMediaAdapter<STTInput, STTOutput> {
  readonly meta = {
    id: "openai-gpt-4o-transcribe",
    provider: "openai" as const,
    kind: "voice-stt" as const,
    qualityTier: "flagship" as const,
    capabilities: ["ar", "en", "multilingual"],
  };

  constructor(private readonly apiKey: string = process.env["OPENAI_API_KEY"] ?? "") {}

  async execute(input: STTInput, ctx: AdapterContext): Promise<STTOutput> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY missing");
    const audio = await fetch(input.audioUrl, { signal: ctx.signal });
    const blob = await audio.blob();
    const form = new FormData();
    form.append("file", blob, "audio");
    form.append("model", "gpt-4o-transcribe");
    if (input.language) form.append("language", input.language);
    if (input.prompt) form.append("prompt", input.prompt);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      signal: ctx.signal,
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI STT error [${res.status}]: ${await res.text()}`);
    const json = (await res.json()) as { text: string; language?: string };
    ctx.onProgress?.(1);
    return { provider: "openai", text: json.text, language: json.language };
  }

  async estimateCost() {
    return { currency: "USD" as const, estimated: 0.006 };
  }

  async healthCheck() {
    return { ok: Boolean(this.apiKey), latencyMs: 0 };
  }
}
