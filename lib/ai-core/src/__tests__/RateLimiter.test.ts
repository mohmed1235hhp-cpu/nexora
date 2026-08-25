import { describe, it, expect } from "vitest";
import { GlobalLimiter } from "../rate-limit/GlobalLimiter";
import { UserLimiter } from "../rate-limit/UserLimiter";

describe("RateLimiter primitives", () => {
  it("global limiter blocks after threshold", () => {
    const g = new GlobalLimiter(2);
    expect(g.allow()).toBe(true);
    expect(g.allow()).toBe(true);
    expect(g.allow()).toBe(false);
  });

  it("user limiter is per-user", () => {
    const u = new UserLimiter(1);
    expect(u.allow("a")).toBe(true);
    expect(u.allow("a")).toBe(false);
    expect(u.allow("b")).toBe(true);
  });
});
