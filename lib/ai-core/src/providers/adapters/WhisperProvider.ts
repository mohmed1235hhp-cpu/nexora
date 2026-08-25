import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "whisper")!;

export class WhisperProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const audioBase64 = inputField<string>(req, "audioBase64");
    if (!audioBase64) throw new Error("whisper:missing-audio");
    const mimeType = inputField<string>(req, "mimeType") ?? "audio/webm";

    const form = new FormData();
    const blob = new Blob([Buffer.from(audioBase64, "base64")], { type: mimeType });
    form.append("file", blob, "audio" + extensionFor(mimeType));
    form.append("model", this.descriptor.models[0].id);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      signal,
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) throw new Error(`whisper:${res.status}`);
    const json = (await res.json()) as { text: string };

    return { ok: true, data: { text: json.text } };
  }
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp3")) return ".mp3";
  if (mimeType.includes("wav")) return ".wav";
  if (mimeType.includes("ogg")) return ".ogg";
  return ".webm";
}
