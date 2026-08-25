import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IArchitectureAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const ArchitectureAgentDescriptor: AgentDescriptor = {
  id: "architecture",
  name: "ArchitectureAgent",
  description: "Designs system architecture and solution blueprints",
  capabilities: ["architecture"],
  priority: 1,
};
