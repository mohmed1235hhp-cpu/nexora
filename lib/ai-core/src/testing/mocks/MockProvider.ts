import type { IProvider } from "../../providers/interfaces/IProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor, ProviderHealth } from "../../types/provider.types";
import type { Capability } from "../../types/capability.types";
import { TaskType } from "../../types/task.types";

export class MockProvider implements IProvider {
  readonly descriptor: ProviderDescriptor = {
    id: "mock",
    name: "Mock",
    enabled: true,
    priority: 1,
    capabilities: Object.values(TaskType),
    models: [],
  };
  supports(_c: Capability): boolean {
    return true;
  }
  async healthCheck(): Promise<ProviderHealth> {
    return { providerId: "mock", healthy: true, lastCheckedAt: new Date().toISOString() };
  }
  async execute(req: AIRequest): Promise<AIResponse> {
    return { ok: true, data: { echo: req.input }, providerId: "mock", requestId: req.meta?.requestId };
  }
}
