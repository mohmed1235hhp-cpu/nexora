import type { AIRequest } from "../../types/request.types";

/** Best-effort plain-text prompt extraction shared by every text-based adapter. */
export function promptText(req: AIRequest): string {
  if (req.messages?.length) {
    return req.messages.map((m) => m.content).join("\n\n");
  }
  const input = req.input as unknown;
  if (typeof input === "string") return input;
  if (input && typeof input === "object" && "prompt" in (input as Record<string, unknown>)) {
    return String((input as Record<string, unknown>).prompt ?? "");
  }
  return "";
}

/** Reads a typed field off req.input without throwing on unexpected shapes. */
export function inputField<T = unknown>(req: AIRequest, field: string): T | undefined {
  const input = req.input as Record<string, unknown> | undefined;
  return input && typeof input === "object" ? (input[field] as T) : undefined;
}

export function anthropicMessages(req: AIRequest): Array<{ role: "user" | "assistant"; content: string }> {
  if (req.messages?.length) {
    return req.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }
  return [{ role: "user", content: promptText(req) }];
}

export function openAiMessages(req: AIRequest): Array<{ role: string; content: string }> {
  if (req.messages?.length) return req.messages.map((m) => ({ role: m.role, content: m.content }));
  return [{ role: "user", content: promptText(req) }];
}
