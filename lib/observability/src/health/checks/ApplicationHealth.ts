import type { HealthCheck, HealthResult } from "../types.js";
export class ApplicationHealth implements HealthCheck {
  readonly name = "application";
  readonly critical = true;
  constructor(private readonly probe: () => boolean | Promise<boolean> = () => true) {}
  async run(): Promise<HealthResult> {
    const alive = await this.probe();
    return { state: alive ? "healthy" : "unhealthy", ts: Date.now(), durationMs: 0 };
  }
}
