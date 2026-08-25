import type { WorkflowStep } from "../WorkflowTypes.js";
export const GenerateReportStep: WorkflowStep = {
  name: "GenerateReport",
  async run(input) { return input; },
};
