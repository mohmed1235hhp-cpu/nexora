import type { IProvider } from "../interfaces/IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { Capability } from "../../types/capability.types";
import type { ProviderDescriptor, ProviderHealth } from "../../types/provider.types";
import { AIErrorCode } from "../../types/error.types";
import { CircuitBreaker } from "../../reliability/CircuitBreaker";
import { getApiKey } from "../../security/ApiKeyVault";
import { AI_CONFIG } from "../../config/ai.config";

/**
 * BaseHttpProvider — the "Provider Adapter" layer of the architecture:
 *
 *   Feature -> Provider Manager -> Provider Adapter -> Provider API
 *
 * Every concrete adapter (Claude, OpenAI, Groq, ...) only implements
 * `doExecute(req, apiKey)`: build the vendor-specific request, call
 * `fetch`, map the vendor response into the normalized `AIResponse` shape.
 * Everything else — timeout, circuit breaker, error normalization, never
 * leaking a raw provider error to the caller — lives here once.
 */
export abstract class BaseHttpProvider implements IProvider {
  abstract readonly descriptor: ProviderDescriptor;
  protected readonly breaker = new CircuitBreaker();

  supports(capability: Capability): boolean {
    return this.descriptor.enabled && this.descriptor.capabilities.includes(capability);
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (this.breaker.isOpen()) {
      return {
        providerId: this.descriptor.id,
        healthy: false,
        lastCheckedAt: new Date().toISOString(),
        reason: "circuit-open",
      };
    }
    const key = await getApiKey(this.descriptor).catch(() => null);
    return {
      providerId: this.descriptor.id,
      healthy: Boolean(key),
      lastCheckedAt: new Date().toISOString(),
      reason: key ? undefined : "no-api-key-configured",
    };
  }

  /** Overridable per-adapter timeout; defaults to the global AI request timeout. */
  protected get timeoutMs(): number {
    return AI_CONFIG.defaultTimeoutMs;
  }

  /** Called by FallbackEngine — the only entry point outside this class. */
  async execute(req: AIRequest): Promise<AIResponse> {
    if (this.breaker.isOpen()) {
      return this.fail(AIErrorCode.ProviderUnavailable, "Provider temporarily disabled after repeated failures", req);
    }

    const apiKey = await getApiKey(this.descriptor).catch(() => null);
    if (!apiKey) {
      return this.fail(AIErrorCode.ProviderNotConfigured, "No API key configured for this provider", req);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const start = Date.now();
    try {
      const res = await this.doExecute(req, apiKey, controller.signal);
      this.breaker.recordSuccess();
      return {
        ...res,
        providerId: this.descriptor.id,
        requestId: req.meta?.requestId,
        usage: { ...res.usage, latencyMs: Date.now() - start },
      };
    } catch (err) {
      this.breaker.recordFailure();
      // NEVER expose the raw provider error (may contain vendor-internal
      // details or echo request content) — normalize to a safe message.
      const code = controller.signal.aborted ? AIErrorCode.Timeout : AIErrorCode.ProviderUnavailable;
      return this.fail(code, controller.signal.aborted ? "Provider request timed out" : "Provider request failed", req);
    } finally {
      clearTimeout(timeout);
    }
  }

  private fail(code: AIErrorCode, message: string, req: AIRequest): AIResponse {
    return {
      ok: false,
      errorCode: code,
      errorMessage: message,
      providerId: this.descriptor.id,
      requestId: req.meta?.requestId,
    };
  }

  /** Implemented by each concrete provider — do the real HTTP call here. */
  protected abstract doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse>;
}
