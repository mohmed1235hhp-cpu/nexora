import type { Capability } from "./capability.types";
import type { ModelDescriptor } from "./model.types";

export interface ProviderDescriptor {
  id: string;
  name: string;
  capabilities: Capability[];
  models: ModelDescriptor[];
  priority: number; // lower = preferred (used as a default/tie-breaker; see routing.config.ts)
  enabled: boolean;
  /** Env var read by ApiKeyVault when no DB-managed key exists for this provider id. */
  apiKeyEnv?: string;
  /** Relative cost tier, purely for the cost-optimization dashboard. */
  costHint?: "low" | "medium" | "high";
}

export interface ProviderHealth {
  providerId: string;
  healthy: boolean;
  lastCheckedAt: string;
  latencyMs?: number;
  reason?: string;
}
