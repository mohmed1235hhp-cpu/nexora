import type { ProviderDescriptor, ProviderHealth } from "../../types/provider.types";
import type { Capability } from "../../types/capability.types";

export interface IProvider {
  readonly descriptor: ProviderDescriptor;
  supports(capability: Capability): boolean;
  healthCheck(): Promise<ProviderHealth>;
}
