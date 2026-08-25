import { describe, it, expect } from "vitest";
import { AlertManager, LogAlertChannel, defaultRules } from "../src/alerts/index.js";

describe("AlertManager", () => {
  it("evaluates rules and dispatches", async () => {
    const captured: unknown[] = [];
    const m = new AlertManager().addChannel(new LogAlertChannel((_msg, a) => captured.push(a)));
    for (const r of defaultRules) m.addRule(r);
    const out = await m.evaluate({ metrics: [{ name: "app.errors", kind: "counter", value: 100, ts: Date.now() }] });
    expect(out.length).toBeGreaterThan(0); expect(captured.length).toBe(out.length);
  });
});
