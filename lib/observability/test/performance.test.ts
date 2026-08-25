import { describe, it, expect } from "vitest";
import { CachingLayer, CompressionLayer, QueryOptimizer, LazyLoader, BundleOptimizer, PerformanceManager } from "../src/performance/index.js";

describe("CachingLayer", () => {
  it("caches with LRU + TTL", () => {
    const c = new CachingLayer<number>({ maxSize: 2, defaultTtlMs: 60_000 });
    c.set("a", 1); c.set("b", 2); c.set("c", 3);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.stats().hitRate).toBeGreaterThan(0);
  });
  it("single-flights concurrent loaders", async () => {
    const c = new CachingLayer<number>();
    let calls = 0;
    const loader = async () => { calls++; await new Promise(r => setTimeout(r, 10)); return 42; };
    const [a, b] = await Promise.all([c.getOrLoad("k", loader), c.getOrLoad("k", loader)]);
    expect(a).toBe(42); expect(b).toBe(42); expect(calls).toBe(1);
  });
});
describe("CompressionLayer", () => {
  it("round-trips gzip and brotli", () => {
    const cl = new CompressionLayer();
    const s = "hello world hello world";
    for (const algo of ["gzip", "br"] as const) {
      const enc = cl.compress(s, algo); const dec = new TextDecoder().decode(cl.decompress(enc, algo));
      expect(dec).toBe(s);
    }
  });
});
describe("QueryOptimizer + BundleOptimizer + LazyLoader", () => {
  it("computes p95 and recommendations", async () => {
    const q = new QueryOptimizer();
    for (let i = 1; i <= 20; i++) q.record({ sql: "S", durationMs: i });
    const r = q.report(); expect(r.count).toBe(20); expect(r.p95Ms).toBeGreaterThan(0);
    const b = new BundleOptimizer().recommend({ big: 500_000, small: 100 });
    expect(b.length).toBe(1);
    const l = new LazyLoader(async () => 7);
    expect(await l.get()).toBe(7); expect(l.isLoaded()).toBe(true);
  });
});
describe("PerformanceManager", () => {
  it("returns snapshot shape", () => {
    const s = new PerformanceManager().snapshot();
    expect(s.memory).toBeDefined(); expect(s.cache).toBeDefined();
  });
});
