import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IDocumentationAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const DocumentationAgentDescriptor: AgentDescriptor = {
  id: "documentation",
  name: "DocumentationAgent",
  description: "Generates documentation and reports",
  capabilities: ["documentation"],
  priority: 1,
};
