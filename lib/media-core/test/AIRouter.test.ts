import { describe, it, expect, vi } from "vitest";
import { AIRouter, type IMediaAdapter } from "../src/router/AIRouter.js";

function makeAdapter(id: string, tier: "flagship" | "balanced" | "cheap", ok = true): IMediaAdapter<{ p: string }, { r: string }> {
  return {
    meta: { id, provider: "openai", kind: "image", qualityTier: tier, capabilities: [] },
    execute: vi.fn(async () => { if (!ok) throw new Error(`${id} fail`); return { r: id }; }),
    estimateCost: async () => ({ currency: "USD", estimated: 0 }),
    healthCheck: async () => ({ ok: true, latencyMs: 0 }),
  };
}

describe("AIRouter", () => {
  it("orders by quality-first and returns first success", async () => {
    const a = makeAdapter("flag", "flagship");
    const b = makeAdapter("bal", "balanced");
    const router = new AIRouter([b, a], { profile: "quality-first", perAttemptTimeoutMs: 1000, totalBudgetMs: 5000, maxAttempts: 3 });
    const { output, report } = await router.run({ p: "" }, { requestId: "r1" }, "image");
    expect(output?.r).toBe("flag");
    expect(report.finalAdapterId).toBe("flag");
  });

  it("falls back on failure", async () => {
    const a = makeAdapter("flag", "flagship", false);
    const b = makeAdapter("bal", "balanced", true);
    const router = new AIRouter([a, b], { profile: "quality-first", perAttemptTimeoutMs: 1000, totalBudgetMs: 5000, maxAttempts: 3 });
    const { output, report } = await router.run({ p: "" }, { requestId: "r2" }, "image");
    expect(output?.r).toBe("bal");
    expect(report.attempts.length).toBe(2);
  });
});
