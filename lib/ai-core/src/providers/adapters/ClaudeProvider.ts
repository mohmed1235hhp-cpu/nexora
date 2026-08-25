import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { anthropicMessages } from "./requestUtils";
import { TaskType } from "../../types/task.types";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "claude")!;

const TASK_SYSTEM_PROMPT: Partial<Record<string, string>> = {
  [TaskType.ApplicationGeneration]: "You generate complete, production-ready application code from the user's description. Return the code and a short explanation.",
  [TaskType.WebsiteGeneration]: "You generate complete, production-ready website code (HTML/CSS/JS or a framework as appropriate) from the user's description.",
  [TaskType.CodeExecution]: "You write and reason about code execution. Return the code and its expected output.",
  [TaskType.CodeReview]: "You review code for bugs, security issues, and style. Be specific and actionable.",
  [TaskType.BugFix]: "You diagnose and fix the described bug. Return the fixed code and a short explanation of the root cause.",
};

export class ClaudeProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const system = TASK_SYSTEM_PROMPT[req.task];
    const body: Record<string, unknown> = {
      model: req.modelId ?? this.descriptor.models[0].id,
      max_tokens: 4096,
      messages: anthropicMessages(req),
      ...(system ? { system } : {}),
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`claude:${res.status}`);
    const json = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      model: string;
    };
    const text = json.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");

    return {
      ok: true,
      data: { text },
      modelId: json.model,
      usage: {
        promptTokens: json.usage?.input_tokens,
        completionTokens: json.usage?.output_tokens,
        totalTokens: (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0),
      },
    };
  }
}
