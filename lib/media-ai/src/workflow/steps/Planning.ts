import type { WorkflowStep } from "../WorkflowTypes.js";
export const PlanningStep: WorkflowStep = {
  name: "Planning",
  async run(input) { return input; },
};
