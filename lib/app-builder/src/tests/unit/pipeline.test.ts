import { describe, it, expect } from "vitest";
import { PipelineRunner, DEFAULT_STEPS } from "../../services/pipeline/PipelineRunner";
describe("PipelineRunner", () => {
  it("runs all default steps", async () => {
    const r = new PipelineRunner();
    const s = await r.run("req_1", "build_1");
    expect(Object.keys(s).length).toBe(DEFAULT_STEPS.length);
  });
});
