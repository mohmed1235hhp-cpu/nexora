import { describe, it, expect } from "vitest";
import { buildFinalReport } from "../../reports/FinalReport";
describe("buildFinalReport", () => {
  it("produces readiness score", () => {
    const r = buildFinalReport({
      job: { id: "j1", spec: {}, createdAt: 0, status: "done" },
      blueprint: null,
      files: [{ path: "a.ts", content: "x", language: "ts" }],
      tests: [{ path: "a.test.ts", content: "y", language: "ts" }],
      security: { findings: [], score: 100 },
      perf: { hints: [], score: 100 },
      pkg: { artifacts: [] },
    });
    expect(r.readinessScore).toBeGreaterThan(0);
  });
});
