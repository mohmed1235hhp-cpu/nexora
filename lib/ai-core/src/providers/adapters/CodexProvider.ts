import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "codex")!;

/**
 * Codex fallback — uses OpenAI's Responses API with the code_interpreter
 * tool to actually execute the code and return real output, rather than
 * just asking the model to guess what the code would print.
 */
export class CodexProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected get timeoutMs() {
    return 45_000;
  }

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const code = inputField<string>(req, "code");
    if (!code) throw new Error("codex:missing-code");
    const language = inputField<string>(req, "language") ?? "python";

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: this.descriptor.models[0].id,
        tools: [{ type: "code_interpreter", container: { type: "auto" } }],
        input: `Run this ${language} code and return only its output:\n\n${code}`,
      }),
    });

    if (!res.ok) throw new Error(`codex:${res.status}`);
    const json = (await res.json()) as {
      output: Array<{ type: string; content?: Array<{ type: string; text?: string }>; logs?: string }>;
    };
    const textItem = json.output.find((o) => o.type === "message");
    const output = textItem?.content?.map((c) => c.text ?? "").join("") ?? "";

    return { ok: true, data: { output } };
  }
}
