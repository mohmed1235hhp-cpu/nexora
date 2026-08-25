import type { ProviderManager } from "../providers/ProviderManager";
import type { AIRequest } from "../types/request.types";
import type { AIResponse } from "../types/response.types";
import type { Capability } from "../types/capability.types";
import { RetryManager } from "./RetryManager";
import { AIMonitor } from "../monitoring/AIMonitor";
import { AILogger } from "../logging/AILogger";
import { ResponseCache } from "../cache/ResponseCache";
import { TaskType } from "../types/task.types";

/** Internal — carries a normalized {ok:false} AIResponse through RetryManager's throw/catch retry loop. */
class FailedProviderResponse extends Error {
  constructor(public response: AIResponse) {
    super(response.errorMessage ?? "provider-failed");
  }
}

/**
 * Tasks safe to cache by (task, input) identity — deterministic-ish
 * lookups/analysis where returning yesterday's identical answer instead of
 * paying a provider again is a clear win. Generative/creative tasks
 * (image/video/music/app/website generation) are intentionally excluded:
 * a user asking for "a logo" twice expects two different results, not a
 * cached repeat.
 */
const CACHEABLE_TASKS = new Set<string>([
  TaskType.TextChat,
  TaskType.InternetSearch,
  TaskType.DocumentAnalysis,
  TaskType.CodeReview,
  TaskType.GeneralAI,
]);
const CACHE_TTL_MS = 5 * 60_000;

/**
 * FallbackEngine — implements the spec's "Automatic Failover":
 *
 *   If provider fails: retry once.
 *   If still fails: switch automatically to the secondary provider.
 *   If secondary fails: switch automatically to the fallback provider.
 *   Log every failure. Never expose provider errors to users.
 *
 * The chain itself (who is primary/secondary/fallback for a capability)
 * comes from ProviderManager -> ProviderRegistry -> routing.config.ts.
 * this class only implements the retry/switch/log/monitor behavior once,
 * uniformly, for every capability.
 */
export class FallbackEngine {
  private retry = new RetryManager();
  private cache = new ResponseCache<AIResponse>(CACHE_TTL_MS);

  constructor(
    private providers: ProviderManager,
    private monitor: AIMonitor = new AIMonitor(),
    private logger: AILogger = new AILogger(),
  ) {}

  private cacheKey(capability: Capability, req: AIRequest): string | null {
    if (!CACHEABLE_TASKS.has(capability) || req.meta?.stream) return null;
    try {
      return `${capability}:${JSON.stringify(req.input)}:${JSON.stringify(req.messages ?? null)}`;
    } catch {
      return null; // non-serializable input — skip caching rather than throw
    }
  }

  async run(capability: Capability, req: AIRequest): Promise<AIResponse> {
    const key = this.cacheKey(capability, req);
    if (key) {
      const cached = this.cache.get(key);
      if (cached) {
        // Cost Optimizer: identical request served from cache instead of
        // paying a provider again. Still counted in the dashboard so cache
        // hit rate is visible, just with zero cost/latency attributed.
        this.monitor.recordSuccess(0, 0);
        return { ...cached, requestId: req.meta?.requestId };
      }
    }

    const chain = this.providers.resolveAll(capability);
    let lastRes: AIResponse | undefined;

    for (const provider of chain) {
      const exec = (provider as unknown as { execute: (r: AIRequest) => Promise<AIResponse> }).execute;
      const start = Date.now();
      try {
        // "Retry once" per provider before moving to the next tier in the
        // chain. BaseHttpProvider.execute() never throws — it resolves to
        // {ok:false} on failure — so RetryManager (which only retries on a
        // thrown rejection) needs failed responses turned into a rejection
        // to actually retry them, then unwrapped back into a normal result.
        const res = await this.retry.run(
          async () => {
            const r = await exec.call(provider, req);
            if (!r.ok) throw new FailedProviderResponse(r);
            return r;
          },
          { attempts: 2, baseDelayMs: 300 },
        );
        const ms = Date.now() - start;

        this.monitor.recordProviderAttempt(provider.descriptor.id, true, ms, res.usage?.costUsd ?? 0);
        this.monitor.recordSuccess(ms, res.usage?.costUsd ?? 0);
        this.logger.logRequest(req, res);
        if (key) this.cache.set(key, res);
        return res;
      } catch (err) {
        const ms = Date.now() - start;
        const failedRes = err instanceof FailedProviderResponse ? err.response : undefined;
        const message = failedRes?.errorMessage ?? (err instanceof Error ? err.message : String(err));

        this.monitor.recordProviderAttempt(provider.descriptor.id, false, ms, 0, message);
        this.logger.logError(req, new Error(`${provider.descriptor.id}: ${message}`));
        // Never surface the raw provider/network error to the caller —
        // only the safe, generic message below ever reaches the user.
        lastRes = failedRes ?? {
          ok: false,
          providerId: provider.descriptor.id,
          errorMessage: "provider-attempt-failed",
        };
      }
    }

    this.monitor.recordFailure(0);
    // Uniform, generic failure — deliberately doesn't echo any upstream
    // provider's error text, per "never expose provider errors to users".
    return {
      ok: false,
      errorMessage: lastRes ? "AI service temporarily unavailable" : "no-provider-configured-for-capability",
      requestId: req.meta?.requestId,
    };
  }
}
