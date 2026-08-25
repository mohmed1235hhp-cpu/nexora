import type { Workflow, WorkflowStep, WorkflowExecutionState } from "../types/workflow.types";
import type { AgentContext } from "../types/agent.types";
import { ExecutionController } from "../orchestrator/ExecutionController";
import { DependencyManager } from "../orchestrator/DependencyManager";
import { TimelineEmitter } from "../timeline/TimelineEmitter";

export class WorkflowEngine {
  constructor(
    private controller: ExecutionController,
    private depManager: DependencyManager,
    private timeline: TimelineEmitter,
  ) {}

  async run(workflow: Workflow, initialInput: unknown, ctx: AgentContext): Promise<WorkflowExecutionState> {
    const state: WorkflowExecutionState = {
      workflowId: workflow.id,
      currentStepIndex: 0,
      completedSteps: [],
      failedSteps: [],
      stepResults: new Map(),
      startedAt: Date.now(),
    };

    this.timeline.emit({ id: `wf-start-${workflow.id}`, phase: "analyzing", status: "in-progress", timestamp: Date.now(), message: `Starting workflow: ${workflow.name}` });

    const levels = this.depManager.computeLevels(workflow.steps);
    let currentInput = initialInput;

    for (const level of levels) {
      // Execute steps in parallel within a level
      const results = await Promise.all(
        level.map(async step => {
          const stepInput = step.inputFromStep ? state.stepResults.get(step.inputFromStep) : (step.inputTemplate ?? currentInput);
          this.timeline.emit({ id: `step-${step.id}`, phase: this.mapCapabilityToPhase(step.capability), status: "in-progress", timestamp: Date.now(), message: `Executing: ${step.id}` });
          const result = await this.controller.executeStep(step, stepInput, ctx);
          this.timeline.emit({ id: `step-${step.id}-done`, phase: this.mapCapabilityToPhase(step.capability), status: result.ok ? "completed" : "failed", timestamp: Date.now() });
          return { step, result };
        })
      );

      for (const { step, result } of results) {
        state.stepResults.set(step.id, result.output);
        if (result.ok) {
          state.completedSteps.push(step.id);
          currentInput = result.output;
        } else {
          state.failedSteps.push(step.id);
        }
      }
      state.currentStepIndex += level.length;
    }

    state.completedAt = Date.now();
    this.timeline.emit({ id: `wf-complete-${workflow.id}`, phase: "completed", status: "completed", timestamp: Date.now(), message: "Workflow completed" });
    return state;
  }

  private mapCapabilityToPhase(cap: string): import("../types/timeline.types").TimelinePhase {
    const map: Record<string, import("../types/timeline.types").TimelinePhase> = {
      "request-parsing": "analyzing",
      "planning": "planning",
      "research": "researching",
      "architecture": "designing",
      "coding": "coding",
      "review": "reviewing",
      "debugging": "debugging",
      "testing": "testing",
      "documentation": "reporting",
      "deployment": "deploying",
      "website-generation": "coding",
      "application-generation": "coding",
      "image-generation": "image-processing",
      "voice-processing": "voice-processing",
      "file-handling": "file-operations",
      "security-analysis": "reviewing",
      "performance-analysis": "reviewing",
      "monitoring": "reporting",
    };
    return map[cap] ?? "coding";
  }
}
