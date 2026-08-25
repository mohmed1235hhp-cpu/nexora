import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "openai-images")!;

export class OpenAIImagesProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected get timeoutMs() {
    return 60_000;
  }

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const size = inputField<string>(req, "size") ?? "1024x1024";
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: req.modelId ?? this.descriptor.models[0].id,
        prompt: promptText(req),
        size,
        n: 1,
      }),
    });

    if (!res.ok) throw new Error(`openai-images:${res.status}`);
    const json = (await res.json()) as { data: Array<{ url?: string; b64_json?: string }> };
    const img = json.data[0];

    return { ok: true, data: { imageUrl: img?.url, imageBase64: img?.b64_json } };
  }
}
