import { describe, it, expect } from "vitest";
import { AIRouter } from "../../ai/AIRouter";
describe("AIRouter", () => {
  it("constructs with an api key", () => {
    const r = new AIRouter("test-key");
    expect(r).toBeDefined();
  });
});
