import { describe, it, expect } from "vitest";
import { Registry, EventBus, TokenBucket, createIdGenerator, safe, ok, err } from "../src/core/index.js";

describe("core/Registry", () => {
  it("rejects duplicates", () => {
    const r = new Registry<{ name: string }>();
    r.register({ name: "a" });
    expect(() => r.register({ name: "a" })).toThrow();
  });
});

describe("core/EventBus", () => {
  it("isolates listener errors", async () => {
    const bus = new EventBus<number>();
    let got = 0;
    bus.subscribe(() => { throw new Error("boom"); });
    bus.subscribe((n) => { got = n; });
    await bus.publish(7);
    expect(got).toBe(7);
  });
});

describe("core/TokenBucket", () => {
  it("respects capacity", () => {
    const tb = new TokenBucket(3, 1000);
    expect(tb.tryConsume()).toBe(true);
    expect(tb.tryConsume()).toBe(true);
    expect(tb.tryConsume()).toBe(true);
  });
});

describe("core/IdGenerator + Result", () => {
  it("produces unique ids and captures errors", async () => {
    const g = createIdGenerator();
    expect(g.next()).not.toBe(g.next());
    expect(ok(1).ok).toBe(true);
    expect(err(new Error("x")).ok).toBe(false);
    const r = await safe(() => { throw new Error("no"); });
    expect(r.ok).toBe(false);
  });
});
