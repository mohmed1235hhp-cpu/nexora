import type { AgentContext, AgentLoggerLike, MessageBusLike, SharedKnowledgeLike, ArtifactStoreLike, AIRouterLike, TimelineEmitterLike, AgentMonitorLike } from "../types/agent.types";

export function createAgentContext(deps: {
  logger: AgentLoggerLike;
  bus: MessageBusLike;
  shared: SharedKnowledgeLike;
  artifacts: ArtifactStoreLike;
  router: AIRouterLike;
  timeline: TimelineEmitterLike;
  monitor: AgentMonitorLike;
  sessionId: string;
}): AgentContext {
  return { ...deps };
}
