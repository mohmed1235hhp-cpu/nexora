import { describe, it, expect } from "vitest";
import { AgentRegistry } from "../orchestrator/AgentRegistry";
import { CodingAgent, CodingAgentDescriptor } from "../agents/coding";

describe("AgentRegistry", () => {
  it("registers and retrieves agents", () => {
    const reg = new AgentRegistry();
    const agent = new CodingAgent();
    reg.register(agent, CodingAgentDescriptor);
    expect(reg.get("coding")).toBe(agent);
    expect(reg.count()).toBe(1);
  });

  it("unregisters agents", () => {
    const reg = new AgentRegistry();
    reg.register(new CodingAgent(), CodingAgentDescriptor);
    expect(reg.unregister("coding")).toBe(true);
    expect(reg.has("coding")).toBe(false);
  });
});
