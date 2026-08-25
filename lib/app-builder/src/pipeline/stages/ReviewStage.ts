import type { AgentContext } from "../../agents/BaseAgent";
import type { AgentRegistry } from "../../agents/AgentRegistry";
import type { FileArtifact } from "../../ai/schemas/common";


export async function runReviewStage(
  ctx: AgentContext,
  agents: AgentRegistry,
  input?: unknown,
): Promise<any> {
  ctx.log("info", "stage:review start");
  // Stage ReviewStage coordinates the corresponding agents. Real orchestration is
  // performed by BuildRunner; this function is the single entry point.
  void input; void agents;
  const result = { stage: "review", files: [] as FileArtifact[] };
  ctx.log("info", "stage:review done");
  return result;
}
