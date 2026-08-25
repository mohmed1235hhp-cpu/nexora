import type { ModelRegistry } from "./ModelRegistry";
import type { Capability } from "../types/capability.types";

export class ModelResolver {
  constructor(private registry: ModelRegistry) {}
  pickForCapability(cap: Capability): string | undefined {
    return this.registry.all().find((m) => m.capabilities.includes(cap))?.id;
  }
}
