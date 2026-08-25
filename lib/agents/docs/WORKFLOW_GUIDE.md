# Workflow Guide

## Predefined presets

```ts
import { fullDevelopmentFlow, codeReviewFlow, contentGenerationFlow } from "@workspace/agents";
```

## Building a custom workflow

```ts
import { WorkflowBuilder } from "@workspace/agents";

const wf = new WorkflowBuilder("my-flow")
  .setName("My Custom Flow")
  .addStep("plan", "planning")
  .addStep("code", "coding", ["plan"])
  .addStep("test", "testing", ["code"])
  .addStep("deploy", "deployment", ["test"])
  .build();
```

## Running a workflow

```ts
import { MasterOrchestrator, registerDefaultAgents } from "@workspace/agents";
import { getAIRouter } from "@workspace/ai-core";

const o = new MasterOrchestrator(getAIRouter());
registerDefaultAgents(o);

const state = await o.executeWorkflow(wf, initialInput, sessionId);
console.log(state.completedSteps, state.failedSteps);
```

## Parallel execution

Steps with no `dependsOn` overlap run **in parallel automatically**. Steps that
depend on prior steps wait for their dependencies via `DependencyManager`.
