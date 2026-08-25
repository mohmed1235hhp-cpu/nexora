import type {
  AdapterContext,
  IMediaAdapter,
  ImageGenerateInput,
  ImageOutput,
} from "@workspace/media-core";

const OPENAI_URL = "https://api.openai.com/v1/images/generations";

export class OpenAIImageAdapter implements IMediaAdapter<ImageGenerateInput, ImageOutput> {
  readonly meta = {
    id: "openai-gpt-image-1",
    provider: "openai" as const,
    kind: "image" as const,
    qualityTier: "flagship" as const,
    capabilities: ["generate", "hd", "high-fidelity-text"],
  };

  constructor(private readonly apiKey: string = process.env["OPENAI_API_KEY"] ?? "") {}

  async execute(input: ImageGenerateInput, ctx: AdapterContext): Promise<ImageOutput> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY missing");
    ctx.onProgress?.(0.1, "requesting");
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      signal: ctx.signal,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: input.prompt,
        size: input.size,
        n: input.n,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI image error [${res.status}]: ${await res.text()}`);
    const json = (await res.json()) as { data: Array<{ url?: string; b64_json?: string }> };
    ctx.onProgress?.(1, "done");
    return {
      provider: "openai",
      model: "gpt-image-1",
      images: json.data.map((d) => ({
        url: d.url ?? `data:image/png;base64,${d.b64_json ?? ""}`,
        b64: d.b64_json,
      })),
    };
  }

  async estimateCost(input: ImageGenerateInput) {
    const per = input.size.startsWith("1792") || input.size.endsWith("1792") ? 0.12 : 0.04;
    return { currency: "USD" as const, estimated: per * input.n };
  }

  async healthCheck() {
    const t = Date.now();
    return { ok: Boolean(this.apiKey), latencyMs: Date.now() - t };
  }
}
