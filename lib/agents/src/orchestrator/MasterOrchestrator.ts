import type { Workflow, WorkflowExecutionState } from "../types/workflow.types";
import type { AgentContext, IAgent, AgentDescriptor } from "../types/agent.types";
import type { AgentResult } from "../types/result.types";
import { AgentRegistry } from "./AgentRegistry";
import { CapabilityRegistry } from "./CapabilityRegistry";
import { DependencyManager } from "./DependencyManager";
import { TaskScheduler } from "./TaskScheduler";
import { ExecutionController } from "./ExecutionController";
import { CommunicationHub } from "./CommunicationHub";
import { WorkflowEngine } from "../workflow/WorkflowEngine";
import { ExecutionTimeline } from "../timeline/ExecutionTimeline";
import { TimelineEmitter } from "../timeline/TimelineEmitter";
import { RetrySystem } from "../execution/RetrySystem";
import { SharedKnowledge } from "../shared/SharedKnowledge";
import { ArtifactStore } from "../shared/ArtifactStore";
import { AgentLogger } from "../logging/AgentLogger";
import { AgentMonitor } from "../monitoring/AgentMonitor";
import { createAgentContext } from "../core/AgentContext";

export class MasterOrchestrator {
  readonly agentRegistry = new AgentRegistry();
  readonly capabilityRegistry = new CapabilityRegistry();
  readonly dependencyManager = new DependencyManager();
  readonly communicationHub = new CommunicationHub();
  readonly timeline = new ExecutionTimeline();
  readonly timelineEmitter = new TimelineEmitter();
  readonly sharedKnowledge = new SharedKnowledge();
  readonly artifactStore = new ArtifactStore();
  readonly logger = new AgentLogger();
  readonly monitor = new AgentMonitor();

  private scheduler: TaskScheduler;
  private retrySystem = new RetrySystem();
  private executionController: ExecutionController;
  private workflowEngine: WorkflowEngine;

  constructor(private aiRouter: { execute(req: unknown): Promise<unknown> }) {
    this.scheduler = new TaskScheduler(this.agentRegistry, this.capabilityRegistry);
    this.executionController = new ExecutionController(this.scheduler, this.retrySystem);
    this.workflowEngine = new WorkflowEngine(
      this.executionController,
      this.dependencyManager,
      this.timelineEmitter,
    );
  }

  registerAgent(agent: IAgent, descriptor: AgentDescriptor): void {
    this.agentRegistry.register(agent, descriptor);
    for (const cap of agent.capabilities) {
      this.capabilityRegistry.register(cap, agent.id);
    }
  }

  unregisterAgent(id: string): boolean {
    this.capabilityRegistry.unregister(id);
    return this.agentRegistry.unregister(id);
  }

  createContext(sessionId: string): AgentContext {
    return createAgentContext({
      logger: this.logger,
      bus: this.communicationHub,
      shared: this.sharedKnowledge,
      artifacts: this.artifactStore,
      router: this.aiRouter,
      timeline: this.timelineEmitter,
      monitor: this.monitor,
      sessionId,
    });
  }

  async executeWorkflow(workflow: Workflow, initialInput: unknown, sessionId: string): Promise<WorkflowExecutionState> {
    const ctx = this.createContext(sessionId);
    return this.workflowEngine.run(workflow, initialInput, ctx);
  }

  getAgentCount(): number {
    return this.agentRegistry.count();
  }

  getActiveAgents(): string[] {
    return this.monitor.getActiveAgents();
  }

  getStats() {
    return this.monitor.getStats();
  }
}
