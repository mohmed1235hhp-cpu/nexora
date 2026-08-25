export interface HealthStatus {
  healthy: boolean;
  checks: Record<string, boolean>;
  timestamp: number;
}

export class HealthCheck {
  private checks = new Map<string, () => boolean | Promise<boolean>>();

  register(name: string, check: () => boolean | Promise<boolean>): void {
    this.checks.set(name, check);
  }

  async run(): Promise<HealthStatus> {
    const results: Record<string, boolean> = {};
    for (const [name, check] of this.checks.entries()) {
      try {
        results[name] = await check();
      } catch {
        results[name] = false;
      }
    }
    return {
      healthy: Object.values(results).every(v => v),
      checks: results,
      timestamp: Date.now(),
    };
  }
}
