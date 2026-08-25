import type { AgentContext } from "../agents/BaseAgent";
import type { FileArtifact } from "../ai/schemas/common";
import { checkLazyLoading } from "./checks/lazyLoading";
import { checkCodeSplitting } from "./checks/codeSplitting";
import { checkMemoization } from "./checks/memoization";
import { checkVirtualLists } from "./checks/virtualLists";
import { checkBundleAudit } from "./checks/bundleAudit";

export interface PerfHint {
  file: string;
  hint: string;
  severity: "info" | "warn";
}

export async function runPerfPass(
  ctx: AgentContext,
  files: FileArtifact[],
): Promise<{ hints: PerfHint[]; score: number }> {
  const hints: PerfHint[] = [];
  for (const f of files) {
    hints.push(...checkLazyLoading(f));
    hints.push(...checkCodeSplitting(f));
    hints.push(...checkMemoization(f));
    hints.push(...checkVirtualLists(f));
    hints.push(...checkBundleAudit(f));
  }
  const score = Math.max(0, 100 - hints.length);
  ctx.log("info", `perf: ${hints.length} hints, score=${score}`);
  return { hints, score };
}
