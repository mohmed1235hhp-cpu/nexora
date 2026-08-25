# Adding a New Agent

```ts
// src/agents/myAgent/MyAgentExecutor.ts
import { AgentBase } from "../../core/AgentBase";
import type { AgentCapability, AgentContext } from "../../types/agent.types";
import type { AgentTask } from "../../types/task.types";
import type { AgentResult } from "../../types/result.types";

export class MyAgent extends AgentBase {
  readonly id = "my-agent";
  readonly name = "MyAgent";
  readonly capabilities: AgentCapability[] = ["coding"];

  protected async doExecute(task: AgentTask, ctx: AgentContext): Promise<AgentResult> {
    ctx.logger.log(this.id, "info", "Doing my work");
    // your logic — usually calls ctx.router.execute(...)
    return { ok: true, output: "done", durationMs: 0 };
  }
}

// register:
orchestrator.registerAgent(new MyAgent(), {
  id: "my-agent", name: "MyAgent",
  description: "...", capabilities: ["coding"], priority: 1,
});
```

That's it. No other file needs to change.
