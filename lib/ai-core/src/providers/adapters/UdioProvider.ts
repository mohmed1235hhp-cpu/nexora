import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "udio")!;

/** Udio — music generation, secondary tier. Submit + poll job pattern. */
export class UdioProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 120_000;
  protected pollIntervalMs = 4_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api.udio.com/v1/generations", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: promptText(req) }),
    });
    if (!res.ok) throw new Error(`udio:${res.status}`);
    const json = (await res.json()) as { id: string };
    return { jobId: json.id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api.udio.com/v1/generations/${jobId}`, {
      signal,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`udio:${res.status}`);
    const json = (await res.json()) as { status: string; audioUrl?: string; error?: string };
    const done = json.status === "completed" || json.status === "failed";
    return { done, ok: json.status === "completed", resultUrl: json.audioUrl, error: json.error };
  }
}
