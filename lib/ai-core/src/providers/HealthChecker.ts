import type { ProviderRegistry } from "./ProviderRegistry";
import type { ProviderHealth } from "../types/provider.types";

export class HealthChecker {
  constructor(private registry: ProviderRegistry) {}
  async checkAll(): Promise<ProviderHealth[]> {
    return Promise.all(this.registry.all().map((p) => p.healthCheck()));
  }
}
