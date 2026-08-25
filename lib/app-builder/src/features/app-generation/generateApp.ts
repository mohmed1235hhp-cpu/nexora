import { pipelineRunner } from "../../services/pipeline/PipelineRunner";
import { uid } from "../../utils/id";
export async function generateApp(description: string): Promise<{ buildId: string; state: Record<string, unknown> }> {
  const buildId = uid("build");
  const state = await pipelineRunner.run(uid("req"), buildId);
  return { buildId, state };
}
