import type { WorkflowStep } from "../WorkflowTypes.js";
export const ExecuteStep: WorkflowStep = {
  name: "Execute",
  async run(input) { return input; },
};
