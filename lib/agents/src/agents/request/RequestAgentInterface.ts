import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IRequestAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const RequestAgentDescriptor: AgentDescriptor = {
  id: "request",
  name: "RequestAgent",
  description: "Parses and normalizes incoming user requests",
  capabilities: ["request-parsing"],
  priority: 1,
};
