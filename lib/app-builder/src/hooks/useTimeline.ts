import { PIPELINE_STAGES } from "../constants/pipelineStages";
import { usePipelineStore } from "../state/pipelineStore";
export function useTimeline() {
  const stages = usePipelineStore((s) => s.stages);
  return PIPELINE_STAGES.map((s) => ({ ...s, state: stages[s.key] }));
}
