import { describe, it, expect } from "vitest";
import { MasterOrchestrator } from "../orchestrator/MasterOrchestrator";
import { registerDefaultAgents } from "../agents/registerDefaultAgents";
import { TaskPlanner } from "../workflow/TaskPlanner";

// Mock router — never hits network.
const mockRouter = {
  execute: async (req: unknown) => ({ ok: true, data: { echoed: req } }),
};

describe("MasterOrchestrator", () => {
  it("registers 18 default agents", () => {
    const o = new MasterOrchestrator(mockRouter);
    registerDefaultAgents(o);
    expect(o.getAgentCount()).toBe(18);
  });

  it("executes a full workflow", async () => {
    const o = new MasterOrchestrator(mockRouter);
    registerDefaultAgents(o);
    const wf = new TaskPlanner().getCodeReviewWorkflow();
    const state = await o.executeWorkflow(wf, { code: "console.log(1)" }, "session-1");
    expect(state.failedSteps).toEqual([]);
    expect(state.completedSteps.length).toBeGreaterThan(0);
  });

  it("collects timeline events during workflow", async () => {
    const o = new MasterOrchestrator(mockRouter);
    registerDefaultAgents(o);
    const events: unknown[] = [];
    o.timelineEmitter.subscribe(e => events.push(e));
    const wf = new TaskPlanner().getCodeReviewWorkflow();
    await o.executeWorkflow(wf, {}, "s");
    expect(events.length).toBeGreaterThan(0);
  });

  it("tracks monitor stats", async () => {
    const o = new MasterOrchestrator(mockRouter);
    registerDefaultAgents(o);
    const wf = new TaskPlanner().getCodeReviewWorkflow();
    await o.executeWorkflow(wf, {}, "s");
    const stats = o.getStats();
    expect(stats.totalTasks).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThan(0);
  });
});
