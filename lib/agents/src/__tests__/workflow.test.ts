import { describe, it, expect } from "vitest";
import { WorkflowBuilder } from "../workflow/WorkflowBuilder";
import { TaskPlanner } from "../workflow/TaskPlanner";

describe("WorkflowBuilder", () => {
  it("builds a workflow with steps", () => {
    const wf = new WorkflowBuilder("test")
      .setName("Test")
      .addStep("a", "coding")
      .addStep("b", "review", ["a"])
      .build();
    expect(wf.steps).toHaveLength(2);
    expect(wf.steps[1].dependsOn).toEqual(["a"]);
  });
});

describe("TaskPlanner", () => {
  it("plans a website workflow", () => {
    const wf = new TaskPlanner().planFromRequest("build a landing page website");
    expect(wf.id).toBe("website");
  });

  it("defaults to full dev", () => {
    const wf = new TaskPlanner().planFromRequest("do something else");
    expect(wf.id).toBe("full-dev");
  });
});
