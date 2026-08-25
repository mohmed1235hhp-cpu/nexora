import { describe, expect, it } from "vitest";
import { imageWorkflow } from "../workflow/ImageWorkflow.js";

describe("imageWorkflow", () => {
  it("runs every step in order", async () => {
    const run = await imageWorkflow.run({ prompt: "hi" }, {});
    expect(run.steps).toHaveLength(10);
    expect(run.steps.every((s) => s.result.status === "ok")).toBe(true);
    expect(run.steps.map((s) => s.name)).toEqual([
      "ReceiveRequest","Analyze","Planning","SelectAgent","Execute",
      "Review","FixErrors","GenerateResult","SaveHistory","GenerateReport",
    ]);
  });
});
