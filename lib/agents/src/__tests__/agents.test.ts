import { describe, it, expect } from "vitest";
import { registerDefaultAgents } from "../agents/registerDefaultAgents";
import { MasterOrchestrator } from "../orchestrator/MasterOrchestrator";

const mockRouter = { execute: async () => ({ ok: true, data: "mock" }) };

describe("All 18 default agents", () => {
  const o = new MasterOrchestrator(mockRouter);
  registerDefaultAgents(o);

  const expected = [
    "request","planning","research","architecture","coding","review",
    "debug","testing","documentation","deployment","website","application",
    "image","voice","file","security","performance","monitoring",
  ];

  for (const id of expected) {
    it(`${id} agent is registered`, () => {
      expect(o.agentRegistry.has(id)).toBe(true);
    });
  }
});
