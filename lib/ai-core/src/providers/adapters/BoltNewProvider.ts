import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "bolt-new")!;

/**
 * Bolt.new (StackBlitz) — website generation, fallback tier. Job-submit +
 * poll pattern; confirm exact endpoint/payload against current Bolt API
 * docs before enabling in production (see note on ReplitAgentProvider).
 */
export class BoltNewProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 180_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api.bolt.new/v1/projects", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: promptText(req) }),
    });
    if (!res.ok) throw new Error(`bolt-new:${res.status}`);
    const json = (await res.json()) as { id: string };
    return { jobId: json.id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api.bolt.new/v1/projects/${jobId}`, {
      signal,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`bolt-new:${res.status}`);
    const json = (await res.json()) as { status: string; previewUrl?: string; error?: string };
    const done = json.status === "ready" || json.status === "failed";
    return { done, ok: json.status === "ready", resultUrl: json.previewUrl, error: json.error };
  }
}
