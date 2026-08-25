import { describe, it, expect } from "vitest";
import { autoFix } from "../../review/autoFix";
describe("autoFix", () => {
  it("appends newline for has-newline rule", () => {
    const out = autoFix(
      [{ path: "a.ts", content: "x", language: "ts" }],
      [{ file: "a.ts", rule: "has-newline", severity: "info", message: "" }],
    );
    expect(out[0].content.endsWith("\n")).toBe(true);
  });
});
