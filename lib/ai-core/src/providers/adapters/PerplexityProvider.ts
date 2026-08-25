import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "perplexity")!;

export class PerplexityProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const query = inputField<string>(req, "query") ?? promptText(req);

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: this.descriptor.models[0].id,
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!res.ok) throw new Error(`perplexity:${res.status}`);
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      citations?: string[];
    };

    return {
      ok: true,
      data: {
        text: json.choices[0]?.message?.content ?? "",
        citations: (json.citations ?? []).map((url) => ({ url, title: url })),
      },
    };
  }
}
