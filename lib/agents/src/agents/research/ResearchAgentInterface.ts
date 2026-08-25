import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IResearchAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const ResearchAgentDescriptor: AgentDescriptor = {
  id: "research",
  name: "ResearchAgent",
  description: "Researches technical topics and gathers context",
  capabilities: ["research"],
  priority: 1,
};
