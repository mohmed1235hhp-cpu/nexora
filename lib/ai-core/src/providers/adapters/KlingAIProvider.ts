import { TaskPollingProvider } from "./TaskPollingProvider";
import type { AIRequest } from "../../types/request.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "kling-ai")!;

/**
 * Kling AI — video generation, fallback tier. Job-submit + poll pattern.
 * Confirm exact endpoint/JWT-signing scheme against Kling's current API
 * docs before enabling in production (Kling uses a signed JWT as the
 * bearer token, derived from an access key + secret key pair — the
 * `apiKey` resolved by ApiKeyVault is expected to already be that signed
 * token, refreshed by whatever process populates the encrypted DB row).
 */
export class KlingAIProvider extends TaskPollingProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected pollTimeoutMs = 180_000;
  protected pollIntervalMs = 5_000;

  protected async submit(req: AIRequest, apiKey: string, signal: AbortSignal) {
    const res = await fetch("https://api-singapore.klingai.com/v1/videos/text2video", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model_name: req.modelId ?? this.descriptor.models[0].id, prompt: promptText(req) }),
    });
    if (!res.ok) throw new Error(`kling-ai:${res.status}`);
    const json = (await res.json()) as { data: { task_id: string } };
    return { jobId: json.data.task_id };
  }

  protected async checkStatus(jobId: string, apiKey: string, signal: AbortSignal) {
    const res = await fetch(`https://api-singapore.klingai.com/v1/videos/text2video/${jobId}`, {
      signal,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`kling-ai:${res.status}`);
    const json = (await res.json()) as {
      data: { task_status: string; task_result?: { videos?: Array<{ url: string }> }; task_status_msg?: string };
    };
    const status = json.data.task_status;
    const done = status === "succeed" || status === "failed";
    return {
      done,
      ok: status === "succeed",
      resultUrl: json.data.task_result?.videos?.[0]?.url,
      error: json.data.task_status_msg,
    };
  }
}
