import type { Workflow, WorkflowStep } from "../types/workflow.types";
import type { AgentCapability } from "../types/agent.types";

export class WorkflowBuilder {
  private id: string;
  private name = "Untitled Workflow";
  private description?: string;
  private steps: WorkflowStep[] = [];

  constructor(id?: string) {
    this.id = id ?? `wf-${Date.now()}`;
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  setDescription(desc: string): this {
    this.description = desc;
    return this;
  }

  addStep(id: string, capability: AgentCapability, dependsOn: string[] = []): this {
    this.steps.push({ id, capability, dependsOn });
    return this;
  }

  addStepWithInput(id: string, capability: AgentCapability, inputFromStep: string, dependsOn?: string[]): this {
    this.steps.push({ id, capability, inputFromStep, dependsOn: dependsOn ?? [inputFromStep] });
    return this;
  }

  build(): Workflow {
    return { id: this.id, name: this.name, description: this.description, steps: this.steps };
  }
}
