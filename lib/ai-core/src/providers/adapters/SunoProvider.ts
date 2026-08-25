import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "suno")!;

/**
 * Suno — music generation. Suno's official API is offered via authorized
 * resellers (no first-party public REST API at time of writing); this
 * adapter targets the standard submit+poll shape those gateways expose.
 * Confirm the concrete base URL with whichever Suno API partner is
 * contracted before enabling in production.
 */
export class SunoProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 120_000;
  protected pollIntervalMs = 4_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api.sunoapi.org/v1/generate", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: promptText(req), instrumental: false }),
    });
    if (!res.ok) throw new Error(`suno:${res.status}`);
    const json = (await res.json()) as { id: string };
    return { jobId: json.id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api.sunoapi.org/v1/generate/${jobId}`, {
      signal,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`suno:${res.status}`);
    const json = (await res.json()) as { status: string; audioUrl?: string; error?: string };
    const done = json.status === "complete" || json.status === "error";
    return { done, ok: json.status === "complete", resultUrl: json.audioUrl, error: json.error };
  }
}
