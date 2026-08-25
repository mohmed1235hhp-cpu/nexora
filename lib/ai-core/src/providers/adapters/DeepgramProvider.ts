import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "deepgram")!;

export class DeepgramProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const audioBase64 = inputField<string>(req, "audioBase64");
    if (!audioBase64) throw new Error("deepgram:missing-audio");
    const mimeType = inputField<string>(req, "mimeType") ?? "audio/webm";

    const res = await fetch(`https://api.deepgram.com/v1/listen?model=${this.descriptor.models[0].id}`, {
      method: "POST",
      signal,
      headers: { authorization: `Token ${apiKey}`, "content-type": mimeType },
      body: Buffer.from(audioBase64, "base64"),
    });

    if (!res.ok) throw new Error(`deepgram:${res.status}`);
    const json = (await res.json()) as {
      results: { channels: Array<{ alternatives: Array<{ transcript: string }> }> };
    };
    const text = json.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

    return { ok: true, data: { text } };
  }
}
