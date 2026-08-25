import type { AuthPrincipal, PermissionRule, ThreatEvent } from "./types.js";
import { EventBus } from "../core/EventBus.js";
import { ApiProtection, type ApiProtectionConfig, type ProtectionInput, type ProtectionResult } from "./ApiProtection.js";
import { PermissionValidator } from "./PermissionValidator.js";
import { InputValidator } from "./InputValidator.js";
import { SecretsManager } from "./SecretsManager.js";
import { EnvironmentValidator, type EnvRequirement } from "./EnvironmentValidator.js";

export interface SecurityManagerConfig {
  readonly api?: ApiProtectionConfig;
  readonly permissions?: readonly PermissionRule[];
  readonly env?: readonly EnvRequirement[];
  readonly secrets?: SecretsManager;
}

/** Orchestrates the security sub-systems. */
export class SecurityManager {
  readonly threats = new EventBus<ThreatEvent>();
  readonly api: ApiProtection;
  readonly permissions: PermissionValidator;
  readonly inputs = new InputValidator();
  readonly env: EnvironmentValidator;
  readonly secrets: SecretsManager | undefined;

  constructor(cfg: SecurityManagerConfig = {}) {
    this.api = new ApiProtection(cfg.api);
    this.permissions = new PermissionValidator(cfg.permissions);
    this.env = new EnvironmentValidator(cfg.env ?? []);
    this.secrets = cfg.secrets;
  }

  guard(input: ProtectionInput): ProtectionResult {
    const r = this.api.guard(input);
    for (const t of r.threats) void this.threats.publish(t);
    return r;
  }
  can(p: AuthPrincipal, perm: string, resource?: string): boolean { return this.permissions.can(p, perm, resource); }
}
