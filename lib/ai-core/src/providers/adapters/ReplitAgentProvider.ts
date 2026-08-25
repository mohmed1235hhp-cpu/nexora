import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "replit-agent")!;

/**
 * Replit Agent — app/website generation. Uses a submit-then-poll job model.
 * NOTE: confirm the exact endpoint path and payload shape against Replit's
 * current Agent API docs before enabling in production; this adapter is
 * wired to the standard REST pattern Replit's platform APIs use elsewhere
 * (Bearer auth, JSON body, task id + polling) so swapping the two literal
 * URLs below is the only change expected once credentials are issued.
 */
export class ReplitAgentProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 180_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api.replit.com/v1/agent/generations", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: promptText(req), target: req.task }),
    });
    if (!res.ok) throw new Error(`replit-agent:${res.status}`);
    const json = (await res.json()) as { id: string };
    return { jobId: json.id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api.replit.com/v1/agent/generations/${jobId}`, {
      signal,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`replit-agent:${res.status}`);
    const json = (await res.json()) as { status: string; repoUrl?: string; error?: string };
    const done = json.status === "completed" || json.status === "failed";
    return { done, ok: json.status === "completed", resultUrl: json.repoUrl, error: json.error };
  }
}
