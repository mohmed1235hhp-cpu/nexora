import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IWebsiteAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const WebsiteAgentDescriptor: AgentDescriptor = {
  id: "website",
  name: "WebsiteAgent",
  description: "Generates full websites",
  capabilities: ["website-generation"],
  priority: 1,
};
