import { describe, it, expect } from "vitest";
import { AsyncQueue } from "../src/core/AsyncQueue.js";
import { CachingLayer } from "../src/performance/CachingLayer.js";

describe("Stress: queue + cache saturation", () => {
  it("processes many push/drain operations", () => {
    const q = new AsyncQueue<number>(10_000);
    for (let i = 0; i < 5000; i++) q.push(i);
    const drained = q.drain();
    expect(drained.length).toBe(5000);
    expect(q.size()).toBe(0);
  });
  it("evicts LRU cache under load", () => {
    const c = new CachingLayer<number>({ maxSize: 100 });
    for (let i = 0; i < 10_000; i++) c.set(`k${i}`, i);
    expect(c.stats().size).toBeLessThanOrEqual(100);
  });
});
