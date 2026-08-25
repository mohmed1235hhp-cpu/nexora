import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InMemoryCache, getCache, nsKey } from "../index";

describe("InMemoryCache", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  it("returns null for a missing key", async () => {
    expect(await cache.get("missing")).toBeNull();
  });

  it("stores and retrieves a value", async () => {
    await cache.set("k", { a: 1 });
    expect(await cache.get("k")).toEqual({ a: 1 });
  });

  it("deletes a value", async () => {
    await cache.set("k", 1);
    await cache.del("k");
    expect(await cache.get("k")).toBeNull();
  });

  it("expires a value after its TTL", async () => {
    vi.useFakeTimers();
    await cache.set("k", "v", 1); // 1 second TTL
    expect(await cache.get("k")).toBe("v");

    vi.advanceTimersByTime(1100);
    expect(await cache.get("k")).toBeNull();
    vi.useRealTimers();
  });

  it("incr() starts at 1 and increments", async () => {
    expect(await cache.incr("counter")).toBe(1);
    expect(await cache.incr("counter")).toBe(2);
    expect(await cache.incr("counter")).toBe(3);
  });

  it("incrWithTtl() sets a TTL alongside the increment", async () => {
    vi.useFakeTimers();
    expect(await cache.incrWithTtl("rl:user1", 1)).toBe(1);
    vi.advanceTimersByTime(1100);
    expect(await cache.get("rl:user1")).toBeNull();
    vi.useRealTimers();
  });

  it("remember() loads and caches on miss, then serves from cache", async () => {
    let calls = 0;
    const loader = async () => {
      calls++;
      return "computed";
    };
    const first = await cache.remember("expensive", 60, loader);
    const second = await cache.remember("expensive", 60, loader);

    expect(first).toBe("computed");
    expect(second).toBe("computed");
    expect(calls).toBe(1);
  });

  it("invalidatePrefix() removes only matching keys", async () => {
    await cache.set("user:1:profile", "a");
    await cache.set("user:1:settings", "b");
    await cache.set("user:2:profile", "c");

    await cache.invalidatePrefix("user:1:");

    expect(await cache.get("user:1:profile")).toBeNull();
    expect(await cache.get("user:1:settings")).toBeNull();
    expect(await cache.get("user:2:profile")).toBe("c");
  });

  it("evicts the oldest ~10% of entries once maxEntries is exceeded", async () => {
    const small = new InMemoryCache(10);
    for (let i = 0; i < 11; i++) {
      await small.set(`k${i}`, i);
    }
    expect(await small.get("k0")).toBeNull(); // oldest entry evicted
    expect(await small.get("k10")).toBe(10); // newest entry survives
  });
});

describe("nsKey()", () => {
  it("joins a namespace and parts with colons", () => {
    expect(nsKey("session", "user1")).toBe("session:user1");
    expect(nsKey("rate-limit", "user1", 42)).toBe("rate-limit:user1:42");
  });
});

describe("getCache()", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to an in-memory cache when REDIS_URL is unset", async () => {
    vi.stubEnv("REDIS_URL", "");
    const client = await getCache();
    await client.set("k", "v");
    expect(await client.get("k")).toBe("v");
  });
});
