import { describe, it, expect } from "vitest";
import { DependencyManager } from "../orchestrator/DependencyManager";
import type { WorkflowStep } from "../types/workflow.types";

describe("DependencyManager", () => {
  it("groups independent steps in one level", () => {
    const dm = new DependencyManager();
    const steps: WorkflowStep[] = [
      { id: "a", capability: "coding", dependsOn: [] },
      { id: "b", capability: "review", dependsOn: [] },
    ];
    const levels = dm.computeLevels(steps);
    expect(levels).toHaveLength(1);
    expect(levels[0]).toHaveLength(2);
  });

  it("orders dependent steps", () => {
    const dm = new DependencyManager();
    const steps: WorkflowStep[] = [
      { id: "a", capability: "coding", dependsOn: [] },
      { id: "b", capability: "review", dependsOn: ["a"] },
    ];
    const levels = dm.computeLevels(steps);
    expect(levels).toHaveLength(2);
    expect(levels[0][0].id).toBe("a");
    expect(levels[1][0].id).toBe("b");
  });

  it("detects cycles", () => {
    const dm = new DependencyManager();
    const steps: WorkflowStep[] = [
      { id: "a", capability: "coding", dependsOn: ["b"] },
      { id: "b", capability: "review", dependsOn: ["a"] },
    ];
    expect(() => dm.computeLevels(steps)).toThrow();
  });
});
