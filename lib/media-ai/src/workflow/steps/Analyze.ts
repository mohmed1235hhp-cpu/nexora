import type { WorkflowStep } from "../WorkflowTypes.js";
export const AnalyzeStep: WorkflowStep = {
  name: "Analyze",
  async run(input) { return input; },
};
