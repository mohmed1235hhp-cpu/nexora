import type { WorkflowStep } from "../WorkflowTypes.js";
export const GenerateResultStep: WorkflowStep = {
  name: "GenerateResult",
  async run(input) { return input; },
};
