import type { AgentContext } from "../agents/BaseAgent";
import type { AgentRegistry } from "../agents/AgentRegistry";
import type { FileArtifact } from "../ai/schemas/common";
import { ALL_REVIEW_RULES } from "./rules";
import { autoFix } from "./autoFix";

export interface Issue {
  file: string;
  rule: string;
  severity: "info" | "warn" | "error";
  message: string;
}

export const MAX_REVIEW_STEPS = 50;

export async function reviewAndFixLoop(
  ctx: AgentContext,
  _agents: AgentRegistry,
  files: FileArtifact[],
): Promise<{ files: FileArtifact[]; issues: Issue[]; steps: number }> {
  let current = files;
  let steps = 0;
  let issues: Issue[] = [];
  while (steps < MAX_REVIEW_STEPS) {
    steps++;
    issues = [];
    for (const rule of ALL_REVIEW_RULES) {
      for (const f of current) issues.push(...rule.check(f));
    }
    if (issues.length === 0) break;
    ctx.log("info", `review step ${steps}: ${issues.length} issues`);
    current = autoFix(current, issues);
  }
  return { files: current, issues, steps };
}
