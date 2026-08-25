import type { SecurityManager } from "../security/SecurityManager.js";
import type { ThreatEvent } from "../security/types.js";
export class SecurityDashboard {
  private readonly threats: ThreatEvent[] = [];
  constructor(private readonly security: SecurityManager, capacity = 500) {
    security.threats.subscribe(t => { this.threats.push(t); if (this.threats.length > capacity) this.threats.shift(); });
  }
  render() {
    const bySeverity = this.threats.reduce<Record<string, number>>((a, t) => { a[t.severity] = (a[t.severity] ?? 0) + 1; return a; }, {});
    return { generatedAt: Date.now(), threats: this.threats.slice(-50), bySeverity, envValidation: this.security.env.validate() };
  }
}
