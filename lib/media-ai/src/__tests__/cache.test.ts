import { describe, expect, it } from "vitest";
import { InMemoryMediaCache } from "../cache/MediaCache.js";

describe("InMemoryMediaCache", () => {
  it("stores and expires entries", async () => {
    const c = new InMemoryMediaCache<number>(10);
    c.set("k", 1);
    expect(c.get("k")).toBe(1);
    await new Promise((r) => setTimeout(r, 20));
    expect(c.get("k")).toBeUndefined();
  });
});
