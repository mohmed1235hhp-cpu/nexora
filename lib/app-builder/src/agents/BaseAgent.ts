import type { AIRouter, AIRunResult } from "../ai/AIRouter";
import type { z } from "zod";

export interface AgentContext {
  jobId: string;
  spec: Record<string, unknown>;
  log: (level: "info" | "warn" | "error", msg: string, meta?: unknown) => void;
}

export abstract class BaseAgent<TSchema extends z.ZodTypeAny> {
  abstract readonly name: string;
  abstract readonly task: string;
  protected abstract schema: TSchema;
  protected abstract system: string;
  protected abstract buildPrompt(ctx: AgentContext): string;

  constructor(protected router: AIRouter) {}

  async run(ctx: AgentContext): Promise<AIRunResult<z.infer<TSchema>>> {
    ctx.log("info", `[${this.name}] starting`);
    const res = await this.router.run({
      task: this.task,
      system: this.system,
      prompt: this.buildPrompt(ctx),
      schema: this.schema,
    });
    ctx.log(res.ok ? "info" : "error", `[${this.name}] ${res.ok ? "ok" : "failed"}`, { error: res.error });
    return res;
  }
}
