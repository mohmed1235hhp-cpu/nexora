/**
 * Intent + complexity analysis.
 * Pluggable: replace `HeuristicIntentAnalyzer` with an LLM-backed one later
 * without touching AICore.
 */
import type { Intent, IntentAnalysis, UserRequest } from "../types";

export interface IIntentAnalyzer {
  analyze(req: UserRequest): Promise<IntentAnalysis>;
}

const CAPABILITY_MAP: Record<Intent, readonly string[]> = {
  chat: ["chat.reply"],
  search: ["search.web", "chat.reply"],
  "image.generate": ["image.generate"],
  "image.analyze": ["image.analyze"],
  voice: ["voice.synthesize"],
  "code.generate": ["planning.plan", "code.generate", "code.review", "code.test"],
  "code.review": ["code.review"],
  "code.fix": ["debug.diagnose", "code.generate"],
  "app.build": [
    "planning.plan",
    "architecture.design",
    "image.generate",
    "content.write",
    "code.generate",
    "code.test",
    "deploy.package",
    "deploy.deliver",
  ],
  "website.build": [
    "planning.plan",
    "design.ui",
    "image.generate",
    "content.write",
    "code.generate",
    "code.test",
    "deploy.package",
    "deploy.deliver",
  ],
  "document.analyze": ["document.parse"],
  research: ["search.web", "research.summarize"],
  general: ["chat.reply"],
};

export class HeuristicIntentAnalyzer implements IIntentAnalyzer {
  async analyze(req: UserRequest): Promise<IntentAnalysis> {
    const text = req.input.toLowerCase();
    const has = (...keys: string[]) => keys.some((k) => text.includes(k));

    let intent: Intent = "general";
    if (has("website", "landing page", "موقع")) intent = "website.build";
    else if (has("build app", "create app", "application", "تطبيق")) intent = "app.build";
    else if (has("generate image", "draw", "picture of", "صورة")) intent = "image.generate";
    else if (has("analyze image", "what is in this image")) intent = "image.analyze";
    else if (has("speak", "voice", "tts", "read aloud")) intent = "voice";
    else if (has("fix bug", "error", "traceback", "debug")) intent = "code.fix";
    else if (has("review my code", "code review")) intent = "code.review";
    else if (has("code", "function", "typescript", "python")) intent = "code.generate";
    else if (has("research", "compare", "investigate")) intent = "research";
    else if (has("search", "look up", "find on the web")) intent = "search";
    else if ((req.attachments ?? []).some((a) => a.kind === "document")) intent = "document.analyze";
    else if ((req.attachments ?? []).some((a) => a.kind === "image")) intent = "image.analyze";

    const requiredCapabilities = CAPABILITY_MAP[intent];
    const complexity =
      requiredCapabilities.length >= 6
        ? "complex"
        : requiredCapabilities.length >= 3
          ? "moderate"
          : req.input.length > 400
            ? "moderate"
            : req.input.length < 40
              ? "trivial"
              : "simple";

    return {
      intent,
      complexity,
      confidence: 0.7,
      requiredCapabilities,
      reasoning: `heuristic match on keywords; length=${req.input.length}; attachments=${req.attachments?.length ?? 0}`,
    };
  }
}
