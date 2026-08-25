import type { HealthCheck, HealthResult, HealthSnapshot } from "./types.js";
import { HealthRegistry } from "./HealthRegistry.js";
import { aggregate } from "./HealthAggregator.js";

const DEFAULT_TIMEOUT = 3000;

function withTimeout<T>(p: Promise<T> | T, ms: number, name: string): Promise<T> {
  return Promise.race<T>([
    Promise.resolve(p),
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`health '${name}' timed out after ${ms}ms`)), ms)),
  ]);
}

export class HealthRunner {
  constructor(private readonly registry: HealthRegistry) {}

  async runOne(check: HealthCheck): Promise<HealthResult> {
    const t0 = Date.now();
    const ts = t0;
    try {
      const r = await withTimeout(check.run(), check.timeoutMs ?? DEFAULT_TIMEOUT, check.name);
      return { ...r, durationMs: Date.now() - t0, ts };
    } catch (e) {
      return {
        state: "unhealthy",
        message: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - t0, ts,
      };
    }
  }

  async runAll(): Promise<HealthSnapshot> {
    const checks = this.registry.list();
    const criticals = new Set(checks.filter((c) => c.critical).map((c) => c.name));
    const entries: [string, HealthResult][] = await Promise.all(
      checks.map(async (c) => [c.name, await this.runOne(c)] as [string, HealthResult]),
    );
    return aggregate(Object.fromEntries(entries), criticals, Date.now());
  }
}
