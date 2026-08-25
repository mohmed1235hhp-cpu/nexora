import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "runway")!;

/** Runway ML task API — POST to create, GET /v1/tasks/{id} to poll. */
export class RunwayProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 180_000;
  protected pollIntervalMs = 5_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
      body: JSON.stringify({
        model: req.modelId ?? this.descriptor.models[0].id,
        promptText: promptText(req),
        ratio: "1280:720",
        duration: 5,
      }),
    });
    if (!res.ok) throw new Error(`runway:${res.status}`);
    const json = (await res.json()) as { id: string };
    return { jobId: json.id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${jobId}`, {
      signal,
      headers: { authorization: `Bearer ${apiKey}`, "X-Runway-Version": "2024-11-06" },
    });
    if (!res.ok) throw new Error(`runway:${res.status}`);
    const json = (await res.json()) as { status: string; output?: string[]; failure?: string };
    const done = json.status === "SUCCEEDED" || json.status === "FAILED";
    return { done, ok: json.status === "SUCCEEDED", resultUrl: json.output?.[0], error: json.failure };
  }
}
