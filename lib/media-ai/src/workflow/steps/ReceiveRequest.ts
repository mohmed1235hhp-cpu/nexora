import type { WorkflowStep } from "../WorkflowTypes.js";
export const ReceiveRequestStep: WorkflowStep = {
  name: "ReceiveRequest",
  async run(input) { return input; },
};
