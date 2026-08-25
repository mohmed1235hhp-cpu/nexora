import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "flux")!;

/** Flux (Black Forest Labs) — submit + poll, per BFL's public API. */
export class FluxProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 60_000;
  protected pollIntervalMs = 1_500;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api.bfl.ml/v1/flux-pro-1.1", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-key": apiKey },
      body: JSON.stringify({ prompt: promptText(req), width: 1024, height: 1024 }),
    });
    if (!res.ok) throw new Error(`flux:${res.status}`);
    const json = (await res.json()) as { id: string };
    return { jobId: json.id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api.bfl.ml/v1/get_result?id=${jobId}`, {
      signal,
      headers: { "x-key": apiKey },
    });
    if (!res.ok) throw new Error(`flux:${res.status}`);
    const json = (await res.json()) as { status: string; result?: { sample?: string } };
    const done = json.status === "Ready" || json.status === "Error" || json.status === "Content Moderated";
    return { done, ok: json.status === "Ready", resultUrl: json.result?.sample, error: json.status };
  }
}
