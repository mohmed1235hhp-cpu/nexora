import { describe, it, expect } from "vitest";
import { CapabilityRegistry } from "../orchestrator/CapabilityRegistry";

describe("CapabilityRegistry", () => {
  it("maps capabilities to agents", () => {
    const reg = new CapabilityRegistry();
    reg.register("coding", "coder-1");
    reg.register("coding", "coder-2");
    expect(reg.getAgents("coding")).toEqual(["coder-1", "coder-2"]);
    expect(reg.getBestAgent("coding")).toBe("coder-1");
  });

  it("unregisters agent from all capabilities", () => {
    const reg = new CapabilityRegistry();
    reg.register("coding", "c1");
    reg.register("review", "c1");
    reg.unregister("c1");
    expect(reg.getAgents("coding")).toEqual([]);
    expect(reg.getAgents("review")).toEqual([]);
  });
});
