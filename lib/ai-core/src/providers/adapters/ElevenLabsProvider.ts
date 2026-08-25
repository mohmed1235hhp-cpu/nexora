import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "elevenlabs")!;
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — ElevenLabs' standard default voice

export class ElevenLabsProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const voiceId = inputField<string>(req, "voice") ?? DEFAULT_VOICE_ID;
    const text = inputField<string>(req, "text") ?? promptText(req);

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({ text, model_id: this.descriptor.models[0].id }),
    });

    if (!res.ok) throw new Error(`elevenlabs:${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    return { ok: true, data: { audioBase64: buf.toString("base64"), mimeType: "audio/mpeg" } };
  }
}
