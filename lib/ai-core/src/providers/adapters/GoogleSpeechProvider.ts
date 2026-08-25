import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "google-speech")!;

export class GoogleSpeechProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const audioBase64 = inputField<string>(req, "audioBase64");
    if (!audioBase64) throw new Error("google-speech:missing-audio");
    const languageCode = inputField<string>(req, "languageCode") ?? "ar-SA";

    const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        config: { encoding: "WEBM_OPUS", languageCode, enableAutomaticPunctuation: true },
        audio: { content: audioBase64 },
      }),
    });

    if (!res.ok) throw new Error(`google-speech:${res.status}`);
    const json = (await res.json()) as { results?: Array<{ alternatives: Array<{ transcript: string }> }> };
    const text = json.results?.map((r) => r.alternatives[0]?.transcript ?? "").join(" ") ?? "";

    return { ok: true, data: { text } };
  }
}
