import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IFileAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const FileAgentDescriptor: AgentDescriptor = {
  id: "file",
  name: "FileAgent",
  description: "Manipulates files and directory structures",
  capabilities: ["file-handling"],
  priority: 1,
};
