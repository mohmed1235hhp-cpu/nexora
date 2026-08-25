import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface ICodingAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const CodingAgentDescriptor: AgentDescriptor = {
  id: "coding",
  name: "CodingAgent",
  description: "Generates source code from specifications",
  capabilities: ["coding"],
  priority: 1,
};
