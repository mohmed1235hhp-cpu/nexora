import type { WorkflowStep } from "../WorkflowTypes.js";
export const SelectAgentStep: WorkflowStep = {
  name: "SelectAgent",
  async run(input) { return input; },
};
