import type { WorkflowStep } from "../WorkflowTypes.js";
export const FixErrorsStep: WorkflowStep = {
  name: "FixErrors",
  async run(input) { return input; },
};
