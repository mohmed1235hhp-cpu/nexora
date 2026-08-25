import { describe, it, expect } from "vitest";
import { MemoryAnalyticsSink, UsageAnalytics, AiAnalytics } from "../src/analytics/index.js";

describe("Analytics aggregation", () => {
  it("aggregates by kind/domain", async () => {
    const sink = new MemoryAnalyticsSink();
    const usage = new UsageAnalytics(sink);
    const ai = new AiAnalytics(sink);
    usage.track("visit"); usage.track("visit"); ai.track("prompt");
    const u = await usage.aggregate(); const a = await ai.aggregate();
    expect(u.count).toBe(2); expect(u.byKind.visit).toBe(2);
    expect(a.count).toBe(1); expect(a.byKind.prompt).toBe(1);
  });
});
