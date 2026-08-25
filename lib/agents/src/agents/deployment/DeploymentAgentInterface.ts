import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IDeploymentAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const DeploymentAgentDescriptor: AgentDescriptor = {
  id: "deployment",
  name: "DeploymentAgent",
  description: "Handles build and deployment preparation",
  capabilities: ["deployment"],
  priority: 1,
};
