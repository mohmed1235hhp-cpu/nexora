import { describe, it, expect } from "vitest";
import { HealthRegistry, HealthRunner } from "../src/health/index.js";

describe("Cascading health failures", () => {
  it("aggregates worst state", async () => {
    const reg = new HealthRegistry();
    reg.register({ name: "a", run: () => ({ state: "healthy", durationMs: 1, ts: Date.now() }) });
    reg.register({ name: "b", run: () => ({ state: "degraded", durationMs: 1, ts: Date.now() }) });
    reg.register({ name: "c", critical: true, run: () => ({ state: "unhealthy", durationMs: 1, ts: Date.now() }) });
    const snap = await new HealthRunner(reg).runAll();
    expect(snap.state).toBe("unhealthy");
    expect(snap.summary.unhealthy).toBe(1);
  });
});
