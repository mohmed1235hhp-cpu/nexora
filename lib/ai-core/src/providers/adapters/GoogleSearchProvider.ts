import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { promptText, inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "google-search")!;

/**
 * Google Custom Search JSON API. Requires both an API key and a Search
 * Engine ID (cx) — the cx is read from GOOGLE_SEARCH_ENGINE_ID since it's
 * a public identifier, not a secret, so it doesn't belong in the key vault.
 */
export class GoogleSearchProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const query = inputField<string>(req, "query") ?? promptText(req);
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
    if (!cx) throw new Error("google-search:missing-engine-id");

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`google-search:${res.status}`);
    const json = (await res.json()) as { items?: Array<{ title: string; link: string; snippet: string }> };
    const results = (json.items ?? []).map((i) => ({ title: i.title, url: i.link, snippet: i.snippet }));

    return { ok: true, data: { results } };
  }
}
