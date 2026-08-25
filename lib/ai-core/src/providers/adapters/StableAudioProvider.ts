import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "stable-audio")!;

/** Stability AI's Stable Audio 2 REST endpoint. */
export class StableAudioProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected get timeoutMs() {
    return 90_000;
  }

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const durationSeconds = inputField<number>(req, "durationSeconds") ?? 30;
    const form = new FormData();
    form.append("prompt", promptText(req));
    form.append("duration", String(durationSeconds));
    form.append("output_format", "mp3");

    const res = await fetch("https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio", {
      method: "POST",
      signal,
      headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
      body: form,
    });

    if (!res.ok) throw new Error(`stable-audio:${res.status}`);
    const json = (await res.json()) as { audio: string; finish_reason: string };
    if (json.finish_reason !== "SUCCESS") throw new Error(`stable-audio:${json.finish_reason}`);

    return { ok: true, data: { audioBase64: json.audio } };
  }
}
