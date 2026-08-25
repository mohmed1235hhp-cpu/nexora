import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "stable-diffusion")!;

/** Stability AI's Stable Image Generate (SD 3.5) REST endpoint. */
export class StableDiffusionProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected get timeoutMs() {
    return 60_000;
  }

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const form = new FormData();
    form.append("prompt", promptText(req));
    form.append("output_format", "png");

    const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
      method: "POST",
      signal,
      headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
      body: form,
    });

    if (!res.ok) throw new Error(`stable-diffusion:${res.status}`);
    const json = (await res.json()) as { image: string; finish_reason: string };
    if (json.finish_reason !== "SUCCESS") throw new Error(`stable-diffusion:${json.finish_reason}`);

    return { ok: true, data: { imageBase64: json.image } };
  }
}
