import type { AIRouter } from "../ai/AIRouter";
import { UIAgent } from "./UIAgent";
import { NavigationAgent } from "./NavigationAgent";
import { StateAgent } from "./StateAgent";
import { LogicAgent } from "./LogicAgent";
import { ApiAgent } from "./ApiAgent";
import { StorageAgent } from "./StorageAgent";
import { ValidationAgent } from "./ValidationAgent";
import { AssetsAgent } from "./AssetsAgent";
import { ReviewerAgent } from "./ReviewerAgent";
import { FixerAgent } from "./FixerAgent";

export function createAgentRegistry(router: AIRouter) {
  return {
    uIAgent: new UIAgent(router),
    navigationAgent: new NavigationAgent(router),
    stateAgent: new StateAgent(router),
    logicAgent: new LogicAgent(router),
    apiAgent: new ApiAgent(router),
    storageAgent: new StorageAgent(router),
    validationAgent: new ValidationAgent(router),
    assetsAgent: new AssetsAgent(router),
    reviewerAgent: new ReviewerAgent(router),
    fixerAgent: new FixerAgent(router),
  };
}
export type AgentRegistry = ReturnType<typeof createAgentRegistry>;
