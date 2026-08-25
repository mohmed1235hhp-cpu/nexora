import type { WorkflowStep } from "../WorkflowTypes.js";
export const ReviewStep: WorkflowStep = {
  name: "Review",
  async run(input) { return input; },
};
