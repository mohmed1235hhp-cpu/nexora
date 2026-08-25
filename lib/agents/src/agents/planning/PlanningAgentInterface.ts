import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IPlanningAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const PlanningAgentDescriptor: AgentDescriptor = {
  id: "planning",
  name: "PlanningAgent",
  description: "Creates execution plans from parsed requests",
  capabilities: ["planning"],
  priority: 1,
};
