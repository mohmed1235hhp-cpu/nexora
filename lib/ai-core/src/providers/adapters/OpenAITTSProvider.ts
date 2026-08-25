import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "openai-tts")!;

export class OpenAITTSProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const text = inputField<string>(req, "text") ?? promptText(req);
    const voice = inputField<string>(req, "voice") ?? "alloy";

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: this.descriptor.models[0].id, input: text, voice }),
    });

    if (!res.ok) throw new Error(`openai-tts:${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    return { ok: true, data: { audioBase64: buf.toString("base64"), mimeType: "audio/mpeg" } };
  }
}
