import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IApplicationAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const ApplicationAgentDescriptor: AgentDescriptor = {
  id: "application",
  name: "ApplicationAgent",
  description: "Generates full applications",
  capabilities: ["application-generation"],
  priority: 1,
};
