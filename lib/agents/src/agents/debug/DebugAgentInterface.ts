import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IDebugAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const DebugAgentDescriptor: AgentDescriptor = {
  id: "debug",
  name: "DebugAgent",
  description: "Identifies and fixes bugs in code",
  capabilities: ["debugging"],
  priority: 1,
};
