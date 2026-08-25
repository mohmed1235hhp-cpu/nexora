import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "veo")!;

/** Veo — video generation via Gemini's async predictLongRunning operation. */
export class VeoProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 180_000;
  protected pollIntervalMs = 5_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const model = req.modelId ?? this.descriptor.models[0].id;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${apiKey}`,
      {
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instances: [{ prompt: promptText(req) }] }),
      },
    );
    if (!res.ok) throw new Error(`veo:${res.status}`);
    const json = (await res.json()) as { name: string };
    return { jobId: json.name };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${jobId}?key=${apiKey}`, { signal });
    if (!res.ok) throw new Error(`veo:${res.status}`);
    const json = (await res.json()) as {
      done?: boolean;
      error?: { message: string };
      response?: { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri: string } }> } };
    };
    if (!json.done) return { done: false };
    if (json.error) return { done: true, ok: false, error: json.error.message };
    const uri = json.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
    return { done: true, ok: Boolean(uri), resultUrl: uri, error: uri ? undefined : "no-video-in-response" };
  }
}
