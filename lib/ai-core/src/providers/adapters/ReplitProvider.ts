import { BaseHttpProvider } from "./BaseHttpProvider";
import type { AIRequest } from "../../types/request.types";
import type { AIResponse } from "../../types/response.types";
import type { ProviderDescriptor } from "../../types/provider.types";
import { PROVIDERS_CONFIG } from "../../config/providers.config";
import { inputField } from "./requestUtils";

const DESCRIPTOR = PROVIDERS_CONFIG.find((p) => p.id === "replit")!;

/**
 * Replit code execution. Confirm the exact endpoint against Replit's
 * current execution API before enabling in production — wired to the
 * standard synchronous run pattern (code + language in, stdout/stderr/exit
 * code out) their platform APIs use elsewhere.
 */
export class ReplitProvider extends BaseHttpProvider {
  readonly descriptor: ProviderDescriptor = DESCRIPTOR;
  protected get timeoutMs() {
    return 30_000;
  }

  protected async doExecute(req: AIRequest, apiKey: string, signal: AbortSignal): Promise<AIResponse> {
    const code = inputField<string>(req, "code");
    if (!code) throw new Error("replit:missing-code");
    const language = inputField<string>(req, "language") ?? "python3";

    const res = await fetch("https://api.replit.com/v1/exec/run", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ code, language }),
    });

    if (!res.ok) throw new Error(`replit:${res.status}`);
    const json = (await res.json()) as { stdout: string; stderr: string; exitCode: number };

    return { ok: true, data: { output: json.stdout, stderr: json.stderr, exitCode: json.exitCode } };
  }
}
