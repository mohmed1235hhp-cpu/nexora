import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface ISecurityAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const SecurityAgentDescriptor: AgentDescriptor = {
  id: "security",
  name: "SecurityAgent",
  description: "Analyzes code and infra for security issues",
  capabilities: ["security-analysis"],
  priority: 1,
};
