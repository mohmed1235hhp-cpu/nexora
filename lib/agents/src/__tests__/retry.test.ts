import { describe, it, expect } from "vitest";
import { RetrySystem } from "../execution/RetrySystem";

describe("RetrySystem", () => {
  it("succeeds on first attempt", async () => {
    const r = new RetrySystem();
    const result = await r.executeWithRetry(async () => "ok", 3, 1);
    expect(result).toBe("ok");
  });

  it("retries until success", async () => {
    const r = new RetrySystem();
    let attempts = 0;
    const result = await r.executeWithRetry(async () => {
      attempts++;
      if (attempts < 2) throw new Error("fail");
      return "success";
    }, 3, 1);
    expect(result).toBe("success");
    expect(attempts).toBe(2);
  });

  it("throws after retry exhaustion", async () => {
    const r = new RetrySystem();
    await expect(r.executeWithRetry(async () => { throw new Error("always fails"); }, 2, 1)).rejects.toThrow();
  });

  it("uses fallback when primary fails", async () => {
    const r = new RetrySystem();
    const result = await r.executeWithFallback(
      async () => { throw new Error("primary fail"); },
      async () => "fallback",
    );
    expect(result).toBe("fallback");
  });
});
