import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface ITestingAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const TestingAgentDescriptor: AgentDescriptor = {
  id: "testing",
  name: "TestingAgent",
  description: "Runs and generates tests",
  capabilities: ["testing"],
  priority: 1,
};
