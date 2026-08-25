import type { IAgent, AgentCapability, AgentDescriptor } from "../../types/agent.types";

export interface IReviewAgent extends IAgent {
  readonly capabilities: AgentCapability[];
}

export const ReviewAgentDescriptor: AgentDescriptor = {
  id: "review",
  name: "ReviewAgent",
  description: "Reviews generated code for quality and correctness",
  capabilities: ["review"],
  priority: 1,
};
