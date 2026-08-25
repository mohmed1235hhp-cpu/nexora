import type {
  AdapterContext,
  IMediaAdapter,
  ImageGenerateInput,
  ImageOutput,
} from "@workspace/media-core";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

export class GeminiImageAdapter implements IMediaAdapter<ImageGenerateInput, ImageOutput> {
  readonly meta = {
    id: "gemini-2.5-flash-image",
    provider: "gemini" as const,
    kind: "image" as const,
    qualityTier: "balanced" as const,
    capabilities: ["generate", "edit", "reference-image"],
  };

  constructor(private readonly apiKey: string = process.env["GEMINI_API_KEY"] ?? "") {}

  async execute(input: ImageGenerateInput, ctx: AdapterContext): Promise<ImageOutput> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY missing");
    ctx.onProgress?.(0.1, "requesting");

    const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
    if (input.referenceImageUrl) {
      const refBytes = await fetch(input.referenceImageUrl).then((r) => r.arrayBuffer());
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: Buffer.from(refBytes).toString("base64"),
        },
      });
    }

    const res = await fetch(`${GEMINI_URL}?key=${this.apiKey}`, {
      method: "POST",
      signal: ctx.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    });
    if (!res.ok) throw new Error(`Gemini image error [${res.status}]: ${await res.text()}`);
    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> };
      }>;
    };
    ctx.onProgress?.(1, "done");
    const images = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.inlineData)
      .filter((d): d is { data: string; mimeType: string } => Boolean(d?.data))
      .map((d) => ({ url: `data:${d.mimeType};base64,${d.data}`, b64: d.data }));
    return { provider: "gemini", model: "gemini-2.5-flash-image", images };
  }

  async estimateCost(input: ImageGenerateInput) {
    return { currency: "USD" as const, estimated: 0.02 * input.n };
  }

  async healthCheck() {
    return { ok: Boolean(this.apiKey), latencyMs: 0 };
  }
}
