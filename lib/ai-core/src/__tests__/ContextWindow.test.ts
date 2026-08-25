import { describe, it, expect } from "vitest";
import { ContextWindow } from "../context/ContextWindow";

describe("ContextWindow", () => {
  it("trims oldest turns first to fit maxTokens", () => {
    const w = new ContextWindow(10);
    const turns = Array.from({ length: 5 }).map((_, i) => ({
      id: String(i),
      role: "user" as const,
      content: "abcdefgh", // ~2 tokens
      createdAt: new Date().toISOString(),
    }));
    const fit = w.fit(turns);
    expect(fit.length).toBeLessThanOrEqual(5);
    expect(fit[fit.length - 1].id).toBe("4");
  });
});
