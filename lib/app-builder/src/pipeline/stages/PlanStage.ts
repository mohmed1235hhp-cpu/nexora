import type { AgentContext } from "../../agents/BaseAgent";
import type { AgentRegistry } from "../../agents/AgentRegistry";
import type { FileArtifact } from "../../ai/schemas/common";


export async function runPlanStage(
  ctx: AgentContext,
  agents: AgentRegistry,
  input?: unknown,
): Promise<any> {
  ctx.log("info", "stage:plan start");
  // Stage PlanStage coordinates the corresponding agents. Real orchestration is
  // performed by BuildRunner; this function is the single entry point.
  void input; void agents;
  const result = { stage: "plan", files: [] as FileArtifact[] };
  ctx.log("info", "stage:plan done");
  return result;
}
