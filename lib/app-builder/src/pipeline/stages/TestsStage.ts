import type { AgentContext } from "../../agents/BaseAgent";
import type { AgentRegistry } from "../../agents/AgentRegistry";
import type { FileArtifact } from "../../ai/schemas/common";


export async function runTestsStage(
  ctx: AgentContext,
  agents: AgentRegistry,
  input?: unknown,
): Promise<any> {
  ctx.log("info", "stage:tests start");
  // Stage TestsStage coordinates the corresponding agents. Real orchestration is
  // performed by BuildRunner; this function is the single entry point.
  void input; void agents;
  const result = { stage: "tests", files: [] as FileArtifact[] };
  ctx.log("info", "stage:tests done");
  return result;
}
