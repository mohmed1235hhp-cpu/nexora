import { describe, it, expect } from "vitest";
import { ParallelExecutor } from "../execution/ParallelExecutor";

describe("ParallelExecutor", () => {
  it("runs all tasks", async () => {
    const p = new ParallelExecutor();
    const tasks = [1, 2, 3].map(n => async () => n * 2);
    const results = await p.runAll(tasks);
    expect(results).toEqual([2, 4, 6]);
  });

  it("respects max concurrency", async () => {
    const p = new ParallelExecutor();
    const tasks = Array.from({ length: 10 }, (_, i) => async () => i);
    const results = await p.runAll(tasks, 3);
    expect(results).toHaveLength(10);
  });
});
