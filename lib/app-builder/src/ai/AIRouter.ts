import { generateText, Output, NoObjectGeneratedError } from "ai";
import type { z } from "zod";
import { createLovableAiGatewayProvider } from "./gateway.server";

export interface AIRunOptions<TSchema extends z.ZodTypeAny> {
  task: string;
  prompt: string;
  system?: string;
  schema?: TSchema;
  model?: string;
  runId?: string;
}

export interface AIRunResult<T> {
  ok: boolean;
  data: T | null;
  raw: string;
  error?: string;
  task: string;
  model: string;
}

const DEFAULT_MODEL = "openai/gpt-5.5";

export class AIRouter {
  constructor(private apiKey: string) {}

  async run<TSchema extends z.ZodTypeAny>(
    opts: AIRunOptions<TSchema>,
  ): Promise<AIRunResult<z.infer<TSchema>>> {
    const model = opts.model ?? DEFAULT_MODEL;
    const gateway = createLovableAiGatewayProvider(this.apiKey, opts.runId, {
      structuredOutputs: true,
    });
    try {
      if (opts.schema) {
        const { experimental_output: output, text } = await generateText({
          model: gateway(model),
          system: opts.system,
          prompt: opts.prompt,
          experimental_output: Output.object({ schema: opts.schema }),
        });
        return { ok: true, data: output as z.infer<TSchema>, raw: text ?? "", task: opts.task, model };
      }
      const { text } = await generateText({
        model: gateway(model),
        system: opts.system,
        prompt: opts.prompt,
      });
      return { ok: true, data: text as unknown as z.infer<TSchema>, raw: text, task: opts.task, model };
    } catch (e) {
      const err = e as Error;
      if (NoObjectGeneratedError.isInstance(err)) {
        return { ok: false, data: null, raw: err.text ?? "", error: err.message, task: opts.task, model };
      }
      return { ok: false, data: null, raw: "", error: err.message, task: opts.task, model };
    }
  }
}

export function pickModel(task: string): string {
  if (task.startsWith("review")) return "openai/gpt-5.5";
  if (task.startsWith("fix")) return "openai/gpt-5.5";
  return DEFAULT_MODEL;
}
