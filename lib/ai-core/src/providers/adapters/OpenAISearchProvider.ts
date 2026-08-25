import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "openai-search")!;

/** OpenAI's web-search-enabled chat completions model. */
export class OpenAISearchProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const query = inputField<string>(req, "query") ?? promptText(req);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: this.descriptor.models[0].id,
        web_search_options: {},
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!res.ok) throw new Error(`openai-search:${res.status}`);
    const json = (await res.json()) as {
      choices: Array<{
        message: { content: string; annotations?: Array<{ url_citation?: { url: string; title: string } }> };
      }>;
    };
    const message = json.choices[0]?.message;
    const citations =
      message?.annotations
        ?.map((a) => a.url_citation)
        .filter((c): c is { url: string; title: string } => Boolean(c)) ?? [];

    return { ok: true, data: { text: message?.content ?? "", citations } };
  }
}
