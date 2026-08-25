import type { ProviderRegistry } from "./ProviderRegistry";
import type { Capability } from "../types/capability.types";

export class CapabilityManager {
  constructor(private registry: ProviderRegistry) {}
  isSupported(cap: Capability): boolean {
    return this.registry.findByCapability(cap).length > 0;
  }
  providersFor(cap: Capability): string[] {
    return this.registry.findByCapability(cap).map((p) => p.descriptor.id);
  }
}
