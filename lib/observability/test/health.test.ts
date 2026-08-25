import { describe, it, expect } from "vitest";
import { HealthRegistry, HealthRunner, ApplicationHealth, MemoryHealth } from "../src/health/index.js";

describe("health/HealthRunner", () => {
  it("aggregates results", async () => {
    const reg = new HealthRegistry();
    reg.register(new ApplicationHealth(() => true));
    reg.register(new MemoryHealth(1_000_000));
    const runner = new HealthRunner(reg);
    const snap = await runner.runAll();
    expect(snap.state === "healthy" || snap.state === "unknown").toBe(true);
    expect(Object.keys(snap.checks).length).toBe(2);
  });

  it("marks critical failures unhealthy", async () => {
    const reg = new HealthRegistry();
    reg.register({ name: "x", critical: true, run: () => ({ state: "unhealthy", ts: Date.now(), durationMs: 0 }) });
    const snap = await new HealthRunner(reg).runAll();
    expect(snap.state).toBe("unhealthy");
  });
});
