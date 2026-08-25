import type { IProvider } from "../interfaces/IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { Capability } from "../../types/capability.types";
import type { ProviderDescriptor, ProviderHealth } from "../../types/provider.types";
import { AIErrorCode } from "../../types/error.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";

const NOOP_DESC = PROVIDERS_CONFIG.find((p) => p.id === "noop")!;

/** Default provider returned when no real provider is registered. */
export class NoopProvider implements IProvider {
  readonly descriptor: ProviderDescriptor = NOOP_DESC;

  supports(_capability: Capability): boolean {
    return true;
  }

  async healthCheck(): Promise<ProviderHealth> {
    return { providerId: this.descriptor.id, healthy: true, lastCheckedAt: new Date().toISOString() };
  }

  async execute(req: AIRequest): Promise<AIResponse> {
    return {
      ok: false,
      errorCode: AIErrorCode.ProviderNotConfigured,
      errorMessage: `No real provider is wired for task "${req.task}". Returned by NoopProvider.`,
      providerId: this.descriptor.id,
      modelId: "noop/echo",
      requestId: req.meta?.requestId,
      data: { echo: req.input, task: req.task },
    };
  }
}
