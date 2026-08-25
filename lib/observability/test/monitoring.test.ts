import { describe, it, expect } from "vitest";
import { MetricRegistry } from "../src/metrics/MetricRegistry.js";
import { EventBus } from "../src/core/EventBus.js";

describe("Monitoring: bus + registry", () => {
  it("registry exposes counter", () => {
    const reg = new MetricRegistry(); const c = reg.counter("test.count");
    c.inc(3); const samples = reg.collect();
    expect(samples.find(s => s.name === "test.count")?.value).toBe(3);
  });
  it("bus isolates listener errors", async () => {
    const bus = new EventBus<number>();
    bus.subscribe(() => { throw new Error("boom"); });
    let got = 0; bus.subscribe(n => { got = n; });
    await bus.publish(5); expect(got).toBe(5);
  });
});
