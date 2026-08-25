import { describe, it, expect } from "vitest";
import { agentRouter } from "../../services/router/AgentRouter";
import { registerAllAgents } from "../../services/router/registerAgents";
describe("AgentRouter", () => {
  it("dispatches agents", async () => {
    registerAllAgents();
    const res = await agentRouter.dispatch("AnalyzerAgent", { requestId: "r", buildId: "b" });
    expect(res.ok).toBe(true);
  });
});
