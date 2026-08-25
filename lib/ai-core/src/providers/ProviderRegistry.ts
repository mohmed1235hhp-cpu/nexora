import type { IProvider } from "./interfaces/IProvider";
import type { Capability } from "../types/capability.types";
import { ROUTING_CONFIG } from "../config/routing.config";

export class ProviderRegistry {
  private providers = new Map<string, IProvider>();

  register(provider: IProvider): void {
    this.providers.set(provider.descriptor.id, provider);
  }

  get(id: string): IProvider | undefined {
    return this.providers.get(id);
  }

  all(): IProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Ordered [primary, secondary, fallback, ...] chain for a capability.
   * Explicit order comes from ROUTING_CONFIG (routing.config.ts); any
   * capable, enabled provider not listed there is appended afterwards,
   * sorted by its own default `priority` — so an unmapped or newly added
   * provider still participates instead of being silently excluded. The
   * built-in "noop" provider is always pushed to the very end as a last
   * line of defense so a capability with no configured provider still
   * degrades to a safe, explicit "unavailable" response instead of the
   * caller getting an empty chain.
   */
  findByCapability(cap: Capability): IProvider[] {
    const capable = this.all().filter((p) => p.descriptor.enabled && p.supports(cap));
    const explicitOrder = ROUTING_CONFIG[cap] ?? [];

    const ordered: IProvider[] = [];
    const seen = new Set<string>();
    for (const id of explicitOrder) {
      const provider = capable.find((p) => p.descriptor.id === id);
      if (provider && !seen.has(id)) {
        ordered.push(provider);
        seen.add(id);
      }
    }

    const rest = capable
      .filter((p) => !seen.has(p.descriptor.id) && p.descriptor.id !== "noop")
      .sort((a, b) => a.descriptor.priority - b.descriptor.priority);
    ordered.push(...rest);

    const noop = capable.find((p) => p.descriptor.id === "noop");
    if (noop && !seen.has("noop")) ordered.push(noop);

    return ordered;
  }
}
