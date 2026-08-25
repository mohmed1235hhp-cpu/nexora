import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IMonitoringAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const MonitoringAgentDescriptor: AgentDescriptor = {
  id: "monitoring",
  name: "MonitoringAgent",
  description: "Monitors execution and produces status reports",
  capabilities: ["monitoring"],
  priority: 1,
};
