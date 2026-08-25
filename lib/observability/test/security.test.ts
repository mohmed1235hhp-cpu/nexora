import { describe, it, expect } from "vitest";
import { RateLimiter, PermissionValidator, InputValidator, EnvironmentValidator, ApiProtection, RequestValidator, SecurityManager, InMemorySecretsProvider, SecretsManager } from "../src/security/index.js";
import { createHmac } from "node:crypto";

describe("RateLimiter", () => {
  it("allows within capacity then blocks", () => {
    const rl = new RateLimiter({ capacity: 2, refillPerSec: 0 });
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(false);
  });
});
describe("PermissionValidator", () => {
  it("checks role permissions", () => {
    const pv = new PermissionValidator([{ role: "admin", permissions: ["*"] }, { role: "user", permissions: ["read"] }]);
    expect(pv.can({ id: "1", roles: ["user"] }, "read")).toBe(true);
    expect(pv.can({ id: "1", roles: ["user"] }, "write")).toBe(false);
    expect(pv.can({ id: "1", roles: ["admin"] }, "write")).toBe(true);
  });
});
describe("InputValidator", () => {
  it("wraps schema safeParse", () => {
    const schema = { safeParse(v: unknown) { return typeof v === "string" ? { success: true as const, data: v } : { success: false as const, error: { issues: [{ path: [], message: "not string" }] } }; } };
    const iv = new InputValidator();
    expect(iv.parse(schema, "ok").ok).toBe(true);
    expect(iv.parse(schema, 1).ok).toBe(false);
  });
});
describe("EnvironmentValidator", () => {
  it("reports missing and invalid keys", () => {
    const ev = new EnvironmentValidator([{ key: "A" }, { key: "B", pattern: /^\d+$/ }]);
    const r = ev.validate({ B: "x" });
    expect(r.ok).toBe(false); expect(r.missing).toContain("A"); expect(r.invalid[0]!.key).toBe("B");
  });
});
describe("ApiProtection + RequestValidator", () => {
  it("blocks oversize and injection, verifies signature", () => {
    const p = new ApiProtection({ maxBodyBytes: 10, rateLimit: { capacity: 5, refillPerSec: 1 } });
    expect(p.guard({ source: "ip", bodySize: 100 }).allowed).toBe(false);
    expect(p.guard({ source: "ip", path: "/x?q=<script>alert(1)</script>" }).allowed).toBe(false);
    const secret = "s"; const body = '{"a":1}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    const rv = new RequestValidator();
    expect(rv.verify({ body, signature: sig, secret }).valid).toBe(true);
    expect(rv.verify({ body, signature: "deadbeef", secret }).valid).toBe(false);
  });
});
describe("SecurityManager + SecretsManager", () => {
  it("integrates and reads secrets", async () => {
    const secrets = new SecretsManager([new InMemorySecretsProvider({ K: "v" })]);
    const sm = new SecurityManager({ permissions: [{ role: "u", permissions: ["p"] }], secrets });
    expect(sm.can({ id: "x", roles: ["u"] }, "p")).toBe(true);
    expect(await secrets.get("K")).toBe("v");
  });
});
