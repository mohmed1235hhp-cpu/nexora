import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IImageAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const ImageAgentDescriptor: AgentDescriptor = {
  id: "image",
  name: "ImageAgent",
  description: "Generates and analyzes images",
  capabilities: ["image-generation"],
  priority: 1,
};
