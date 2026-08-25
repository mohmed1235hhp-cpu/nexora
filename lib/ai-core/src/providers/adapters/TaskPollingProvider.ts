import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";

/**
 * Many generative-media vendors (video, music) use an async job pattern:
 * submit a job -> poll a status endpoint -> download the result once it's
 * done. This base class implements the poll loop once; subclasses only
 * implement `submit()` and `parseStatus()`.
 */
export abstract class TaskPollingProvider extends BaseHttpProvider {
  /** Max time to wait for the job before treating it as a failure and
   *  letting FallbackEngine move on to the next provider in the chain. */
  protected pollTimeoutMs = 120_000;
  protected pollIntervalMs = 3_000;

  protected get timeoutMs(): number {
    return this.pollTimeoutMs + 10_000;
  }

  protected abstract submit(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<{ jobId: string }>;
  protected abstract checkStatus(
    jobId: string,
    apiKey: string,
    signal: AbortSignal,
  ): Promise<{ done: boolean; ok?: boolean; resultUrl?: string; error?: string }>;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const { jobId } = await this.submit(req, apiKey, signal);
    const deadline = Date.now() + this.pollTimeoutMs;

    while (Date.now() < deadline) {
      if (signal.aborted) throw new Error("aborted");
      const status = await this.checkStatus(jobId, apiKey, signal);
      if (status.done) {
        if (status.ok && status.resultUrl) {
          return { ok: true, data: { url: status.resultUrl, jobId } };
        }
        throw new Error(status.error ?? "generation-failed");
      }
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));
    }
    throw new Error("generation-timeout");
  }
}
