import type { WorkflowStep } from "../WorkflowTypes.js";
export const SaveHistoryStep: WorkflowStep = {
  name: "SaveHistory",
  async run(input) { return input; },
};
