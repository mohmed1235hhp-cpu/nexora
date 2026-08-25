import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IPerformanceAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const PerformanceAgentDescriptor: AgentDescriptor = {
  id: "performance",
  name: "PerformanceAgent",
  description: "Analyzes and optimizes performance",
  capabilities: ["performance-analysis"],
  priority: 1,
};
